import { describe, expect, it } from 'vitest'
import { assemblePersonReportData } from './reportDataAssembler'
import type { RepositoryScanResult, TrackedPerson } from '../types'

const people: TrackedPerson[] = [
  { displayName: 'Devon Lane', aliases: ['devon.lane@enterprise.com', 'devon'] },
  { displayName: 'Sarah Connor', aliases: ['sarah@enterprise.com'] }
]

function buildScanResult(): RepositoryScanResult {
  return {
    commits: [
      {
        repositoryUrl: 'https://github.com/org/repo-a.git',
        hash: 'aaa111',
        authorName: 'Devon Lane',
        authorEmail: 'devon.lane@enterprise.com',
        authorDate: '2024-01-10T00:00:00Z',
        message: 'Fix login bug involving secretToken',
        fileDiffs: [
          {
            path: 'src/auth.ts',
            lines: [{ kind: 'add', text: 'const token = "secretToken"' }]
          }
        ],
        linesAdded: 1,
        linesRemoved: 0
      },
      {
        repositoryUrl: 'https://github.com/org/repo-b.git',
        hash: 'bbb222',
        authorName: 'Sarah Connor',
        authorEmail: 'sarah@enterprise.com',
        authorDate: '2024-01-12T00:00:00Z',
        message: 'Add tests',
        fileDiffs: [],
        linesAdded: 5,
        linesRemoved: 2
      },
      {
        repositoryUrl: 'https://github.com/org/repo-a.git',
        hash: 'ccc333',
        authorName: 'Unknown Contributor',
        authorEmail: 'unknown@example.com',
        authorDate: '2024-01-11T00:00:00Z',
        message: 'Unmatched commit',
        fileDiffs: [],
        linesAdded: 1,
        linesRemoved: 1
      }
    ],
    skippedBinaryFiles: [
      { repositoryUrl: 'https://github.com/org/repo-a.git', commitHash: 'aaa111', path: 'assets/logo.png' },
      { repositoryUrl: 'https://github.com/org/repo-c.git', commitHash: 'zzz999', path: 'other.bin' }
    ],
    errors: []
  }
}

describe('assemblePersonReportData', () => {
  it('produces one report entry per person with at least one matched commit', () => {
    const results = assemblePersonReportData(
      buildScanResult(),
      people,
      [],
      'Team Alpha',
      { from: '2024-01-01', to: '2024-01-31' }
    )
    expect(results).toHaveLength(2)
    expect(results.map((r) => r.person.displayName).sort()).toEqual(['Devon Lane', 'Sarah Connor'])
  })

  it('excludes unmatched commits from any person report', () => {
    const results = assemblePersonReportData(buildScanResult(), people, [], 'Team Alpha', {
      from: '2024-01-01',
      to: '2024-01-31'
    })
    const allHashes = results.flatMap((r) => r.commits.map((c) => c.hash))
    expect(allHashes).not.toContain('ccc333')
  })

  it('redacts blacklisted words from commit messages and diff content', () => {
    const results = assemblePersonReportData(buildScanResult(), people, ['secretToken'], 'Team Alpha', {
      from: '2024-01-01',
      to: '2024-01-31'
    })
    const devon = results.find((r) => r.person.displayName === 'Devon Lane')!
    expect(devon.commits[0].message).toContain('**CENSORED**')
    expect(devon.commits[0].fileDiffs[0].lines[0].text).toContain('**CENSORED**')
  })

  it('computes total lines added/removed and repositories touched per person', () => {
    const results = assemblePersonReportData(buildScanResult(), people, [], 'Team Alpha', {
      from: '2024-01-01',
      to: '2024-01-31'
    })
    const sarah = results.find((r) => r.person.displayName === 'Sarah Connor')!
    expect(sarah.totalLinesAdded).toBe(5)
    expect(sarah.totalLinesRemoved).toBe(2)
    expect(sarah.repositoriesTouched).toEqual(['https://github.com/org/repo-b.git'])
  })

  it('scopes skipped binary files to repositories the person touched', () => {
    const results = assemblePersonReportData(buildScanResult(), people, [], 'Team Alpha', {
      from: '2024-01-01',
      to: '2024-01-31'
    })
    const devon = results.find((r) => r.person.displayName === 'Devon Lane')!
    expect(devon.skippedBinaryFiles).toHaveLength(1)
    expect(devon.skippedBinaryFiles[0].path).toBe('assets/logo.png')

    const sarah = results.find((r) => r.person.displayName === 'Sarah Connor')!
    expect(sarah.skippedBinaryFiles).toHaveLength(0)
  })
})
