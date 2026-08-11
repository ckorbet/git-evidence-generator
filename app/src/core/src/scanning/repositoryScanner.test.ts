import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile } from 'node:fs/promises'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { scanRepositories, buildAuthenticatedUrl } from './repositoryScanner'

const execFileAsync = promisify(execFile)

/** Runs a git command in `cwd` with a fixed author/committer identity and optional backdating. */
async function git(cwd: string, args: string[], authorDate?: string): Promise<void> {
  await execFileAsync('git', args, {
    cwd,
    env: {
      ...process.env,
      GIT_AUTHOR_NAME: 'Devon Lane',
      GIT_AUTHOR_EMAIL: 'devon.lane@enterprise.com',
      GIT_COMMITTER_NAME: 'Devon Lane',
      GIT_COMMITTER_EMAIL: 'devon.lane@enterprise.com',
      ...(authorDate ? { GIT_AUTHOR_DATE: authorDate, GIT_COMMITTER_DATE: authorDate } : {})
    }
  })
}

describe('scanRepositories (integration, real local git repository)', () => {
  let sourceRepoDir: string

  beforeEach(async () => {
    sourceRepoDir = await mkdtemp(join(tmpdir(), 'gitevidence-fixture-'))
    await git(sourceRepoDir, ['init', '-q'])
    await git(sourceRepoDir, ['config', 'user.email', 'devon.lane@enterprise.com'])
    await git(sourceRepoDir, ['config', 'user.name', 'Devon Lane'])

    await writeFile(join(sourceRepoDir, 'app.ts'), 'const value = 1\n')
    await git(sourceRepoDir, ['add', '.'])
    await git(sourceRepoDir, ['commit', '-q', '-m', 'Initial commit'], '2024-01-05T10:00:00')

    await writeFile(join(sourceRepoDir, 'app.ts'), 'const value = 2\n')
    await git(sourceRepoDir, ['add', '.'])
    await git(sourceRepoDir, ['commit', '-q', '-m', 'Update value'], '2024-01-15T10:00:00')

    await writeFile(join(sourceRepoDir, 'logo.png'), Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x00, 0x01, 0x02]))
    await git(sourceRepoDir, ['add', '.'])
    await git(sourceRepoDir, ['commit', '-q', '-m', 'Add binary asset'], '2024-01-20T10:00:00')

    // Commit outside the requested date range - must not appear in scan results.
    await writeFile(join(sourceRepoDir, 'app.ts'), 'const value = 3\n')
    await git(sourceRepoDir, ['add', '.'])
    await git(sourceRepoDir, ['commit', '-q', '-m', 'Out of range commit'], '2024-03-01T10:00:00')
  })

  afterEach(async () => {
    await rm(sourceRepoDir, { recursive: true, force: true })
  })

  it('clones the repository and returns commits within the requested date range', async () => {
    const result = await scanRepositories({
      repositories: [{ url: sourceRepoDir }],
      credential: { username: '', pat: '' },
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      extensionWhitelist: ['.ts']
    })

    expect(result.errors).toEqual([])
    expect(result.commits).toHaveLength(3)
    expect(result.commits.map((c) => c.message).sort()).toEqual([
      'Add binary asset',
      'Initial commit',
      'Update value'
    ])
    expect(result.commits.some((c) => c.message === 'Out of range commit')).toBe(false)
  })

  it('applies the extension whitelist to exclude non-matching files from diffs', async () => {
    const result = await scanRepositories({
      repositories: [{ url: sourceRepoDir }],
      credential: { username: '', pat: '' },
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      extensionWhitelist: ['.md']
    })

    for (const commit of result.commits) {
      expect(commit.fileDiffs).toEqual([])
    }
  })

  it('detects and records skipped binary files instead of including them as diffs', async () => {
    const result = await scanRepositories({
      repositories: [{ url: sourceRepoDir }],
      credential: { username: '', pat: '' },
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      extensionWhitelist: []
    })

    expect(result.skippedBinaryFiles).toHaveLength(1)
    expect(result.skippedBinaryFiles[0].path).toBe('logo.png')
  })

  it('isolates a failure for one unreachable repository without aborting the whole scan', async () => {
    const result = await scanRepositories({
      repositories: [{ url: sourceRepoDir }, { url: join(tmpdir(), 'does-not-exist-repo') }],
      credential: { username: '', pat: '' },
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31',
      extensionWhitelist: ['.ts']
    })

    expect(result.errors).toHaveLength(1)
    expect(result.errors[0].repositoryUrl).toContain('does-not-exist-repo')
    // The valid repository's commits are still returned despite the other repository failing.
    expect(result.commits.length).toBeGreaterThan(0)
  })
})

describe('buildAuthenticatedUrl', () => {
  it('injects username and PAT into an HTTPS URL', () => {
    const result = buildAuthenticatedUrl('https://github.com/org/repo.git', {
      username: 'devon',
      pat: 'tok123'
    })
    expect(result).toBe('https://devon:tok123@github.com/org/repo.git')
  })

  it('returns the URL unmodified when credential fields are empty', () => {
    const result = buildAuthenticatedUrl('https://github.com/org/repo.git', { username: '', pat: '' })
    expect(result).toBe('https://github.com/org/repo.git')
  })

  it('returns the input unmodified when it is not a well-formed URL', () => {
    const result = buildAuthenticatedUrl('C:\\local\\path\\repo', { username: 'devon', pat: 'tok' })
    expect(result).toBe('C:\\local\\path\\repo')
  })
})
