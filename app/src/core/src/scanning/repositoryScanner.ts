import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import simpleGit from 'simple-git'
import type {
  RepositoryEntry,
  RepositoryScanError,
  RepositoryScanResult,
  ScanProgressEvent,
  ScannedCommit,
  SkippedBinaryFile
} from '../types'
import { matchesExtensionWhitelist } from '../filtering/extensionFilter'
import { parseCommitDiffOutput } from './diffParser'
import { GIT_LOG_FORMAT, parseGitLogOutput } from './logParser'

export interface ScanOptions {
  repositories: RepositoryEntry[]
  credential: { username: string; pat: string }
  dateFrom: string
  dateTo: string
  extensionWhitelist: string[]
  onProgress?: (event: ScanProgressEvent) => void
}

/** Injects a username + PAT into an HTTPS repository URL for authenticated clone/fetch. */
export function buildAuthenticatedUrl(url: string, credential: { username: string; pat: string }): string {
  if (!credential.username || !credential.pat) return url
  // Only rewrite genuine http(s) URLs. `new URL()` would otherwise happily (mis)parse
  // Windows drive-letter paths like "C:\repo" as a URL with scheme "c:", corrupting them.
  if (!/^https?:\/\//i.test(url)) return url
  try {
    const parsed = new URL(url)
    parsed.username = encodeURIComponent(credential.username)
    parsed.password = encodeURIComponent(credential.pat)
    return parsed.toString()
  } catch {
    // Not a well-formed URL - return unmodified.
    return url
  }
}

/**
 * Scans every configured repository for commits within the requested date range,
 * isolating failures per-repository so one broken repository never aborts the run.
 */
export async function scanRepositories(options: ScanOptions): Promise<RepositoryScanResult> {
  const commits: ScannedCommit[] = []
  const skippedBinaryFiles: SkippedBinaryFile[] = []
  const errors: RepositoryScanError[] = []

  for (const repository of options.repositories) {
    options.onProgress?.({ repositoryUrl: repository.url, stage: 'cloning' })
    let tempDir: string | null = null
    try {
      tempDir = await mkdtemp(join(tmpdir(), 'gitevidence-'))
      await cloneRepository(repository, options.credential, tempDir)

      options.onProgress?.({ repositoryUrl: repository.url, stage: 'scanning' })
      const { commits: repoCommits, skippedBinaryFiles: repoSkipped } = await scanClonedRepository(
        repository.url,
        tempDir,
        options.dateFrom,
        options.dateTo,
        options.extensionWhitelist
      )
      commits.push(...repoCommits)
      skippedBinaryFiles.push(...repoSkipped)

      options.onProgress?.({ repositoryUrl: repository.url, stage: 'done' })
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push({ repositoryUrl: repository.url, message })
      options.onProgress?.({ repositoryUrl: repository.url, stage: 'failed', message })
    } finally {
      if (tempDir) {
        await rm(tempDir, { recursive: true, force: true }).catch(() => undefined)
      }
    }
  }

  return { commits, skippedBinaryFiles, errors }
}

async function cloneRepository(
  repository: RepositoryEntry,
  credential: { username: string; pat: string },
  destination: string
): Promise<void> {
  const authenticatedUrl = buildAuthenticatedUrl(repository.url, credential)
  const git = simpleGit()
  const cloneArgs = repository.branch ? ['--branch', repository.branch] : []
  await git.clone(authenticatedUrl, destination, cloneArgs)
}

async function scanClonedRepository(
  originalUrl: string,
  repoDir: string,
  dateFrom: string,
  dateTo: string,
  extensionWhitelist: string[]
): Promise<{ commits: ScannedCommit[]; skippedBinaryFiles: SkippedBinaryFile[] }> {
  const git = simpleGit(repoDir)
  const commits: ScannedCommit[] = []
  const skippedBinaryFiles: SkippedBinaryFile[] = []

  const rawLog = await git.raw([
    'log',
    `--since=${dateFrom} 00:00:00`,
    `--until=${dateTo} 23:59:59`,
    `--pretty=format:${GIT_LOG_FORMAT}`
  ])

  const entries = parseGitLogOutput(rawLog)

  for (const entry of entries) {
    const rawDiff = await git.raw(['diff-tree', '--root', '-p', '--no-color', '-r', entry.hash])
    const { fileDiffs, binaryPaths, linesAdded, linesRemoved } = parseCommitDiffOutput(rawDiff)

    for (const path of binaryPaths) {
      skippedBinaryFiles.push({ repositoryUrl: originalUrl, commitHash: entry.hash, path })
    }

    const filteredFileDiffs = fileDiffs.filter((file) =>
      matchesExtensionWhitelist(file.path, extensionWhitelist)
    )

    commits.push({
      repositoryUrl: originalUrl,
      hash: entry.hash,
      authorName: entry.authorName,
      authorEmail: entry.authorEmail,
      authorDate: entry.authorDateIso,
      message: entry.message,
      fileDiffs: filteredFileDiffs,
      linesAdded,
      linesRemoved
    })
  }

  return { commits, skippedBinaryFiles }
}
