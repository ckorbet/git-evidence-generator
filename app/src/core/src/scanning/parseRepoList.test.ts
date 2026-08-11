import { describe, expect, it } from 'vitest'
import { parseRepositoryList, serializeRepositoryList } from './parseRepoList'

describe('parseRepositoryList', () => {
  it('parses a repository entry without a branch', () => {
    const result = parseRepositoryList('https://github.com/org/main-service.git')
    expect(result).toEqual([{ url: 'https://github.com/org/main-service.git' }])
  })

  it('parses a repository entry with an explicit branch', () => {
    const result = parseRepositoryList('https://github.com/org/main-service.git develop')
    expect(result).toEqual([
      { url: 'https://github.com/org/main-service.git', branch: 'develop' }
    ])
  })

  it('parses multiple repositories, one per line, ignoring blank lines', () => {
    const result = parseRepositoryList(
      'https://github.com/org/a.git\n\nhttps://github.com/org/b.git main\n'
    )
    expect(result).toEqual([
      { url: 'https://github.com/org/a.git' },
      { url: 'https://github.com/org/b.git', branch: 'main' }
    ])
  })

  it('round-trips through serializeRepositoryList', () => {
    const input = 'https://github.com/org/a.git\nhttps://github.com/org/b.git main'
    const parsed = parseRepositoryList(input)
    expect(serializeRepositoryList(parsed)).toBe(input)
  })
})
