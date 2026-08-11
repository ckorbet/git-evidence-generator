import { describe, expect, it } from 'vitest'
import { groupCommitsByPerson, matchAuthorToPerson } from './matchAuthor'
import type { ScannedCommit, TrackedPerson } from '../types'

const devon: TrackedPerson = {
  displayName: 'Devon Lane',
  aliases: ['devon.lane@enterprise.com', 'dl-dev']
}
const sarah: TrackedPerson = {
  displayName: 'Sarah Connor',
  aliases: ['sarah.connor@enterprise.com']
}

function commit(overrides: Partial<ScannedCommit>): ScannedCommit {
  return {
    repositoryUrl: 'https://example.com/repo.git',
    hash: 'abc123',
    authorName: '',
    authorEmail: '',
    authorDate: '2024-01-01T00:00:00Z',
    message: 'test commit',
    fileDiffs: [],
    linesAdded: 0,
    linesRemoved: 0,
    ...overrides
  }
}

describe('matchAuthorToPerson', () => {
  it('matches by exact email (case-insensitive)', () => {
    const match = matchAuthorToPerson(
      { authorName: 'Devon', authorEmail: 'DEVON.LANE@enterprise.com' },
      [devon, sarah]
    )
    expect(match).toBe(devon)
  })

  it('matches by substring username alias in a noreply email', () => {
    const match = matchAuthorToPerson(
      { authorName: 'Devon Lane', authorEmail: '12345+dl-dev@users.noreply.github.com' },
      [devon, sarah]
    )
    expect(match).toBe(devon)
  })

  it('returns null when no tracked person matches', () => {
    const match = matchAuthorToPerson(
      { authorName: 'Unknown Person', authorEmail: 'unknown@example.com' },
      [devon, sarah]
    )
    expect(match).toBeNull()
  })

  it('matches the correct person among multiple tracked people', () => {
    const match = matchAuthorToPerson(
      { authorName: 'Sarah Connor', authorEmail: 'sarah.connor@enterprise.com' },
      [devon, sarah]
    )
    expect(match).toBe(sarah)
  })
})

describe('groupCommitsByPerson', () => {
  it('groups matched commits by person and excludes unmatched commits', () => {
    const commits = [
      commit({ hash: '1', authorEmail: 'devon.lane@enterprise.com' }),
      commit({ hash: '2', authorEmail: 'sarah.connor@enterprise.com' }),
      commit({ hash: '3', authorEmail: 'unmatched@example.com' }),
      commit({ hash: '4', authorEmail: 'devon.lane@enterprise.com' })
    ]

    const grouped = groupCommitsByPerson(commits, [devon, sarah])

    expect(grouped.get(devon)?.map((c) => c.hash)).toEqual(['1', '4'])
    expect(grouped.get(sarah)?.map((c) => c.hash)).toEqual(['2'])
    expect(grouped.size).toBe(2)
  })
})
