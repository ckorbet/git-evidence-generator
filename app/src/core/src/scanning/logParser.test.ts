import { describe, expect, it } from 'vitest'
import { GIT_LOG_FORMAT, parseGitLogOutput } from './logParser'

describe('parseGitLogOutput', () => {
  it('parses a single commit record', () => {
    const raw = `abc123\u001fDevon Lane\u001fdevon.lane@enterprise.com\u001f2024-01-15T10:00:00+00:00\u001fFix the bug\u001e`
    const result = parseGitLogOutput(raw)
    expect(result).toEqual([
      {
        hash: 'abc123',
        authorName: 'Devon Lane',
        authorEmail: 'devon.lane@enterprise.com',
        authorDateIso: '2024-01-15T10:00:00+00:00',
        message: 'Fix the bug'
      }
    ])
  })

  it('parses multiple commit records separated by the record separator', () => {
    const raw =
      `abc123\u001fDevon Lane\u001fdevon@x.com\u001f2024-01-01T00:00:00Z\u001fFirst commit\u001e\n` +
      `def456\u001fSarah Connor\u001fsarah@x.com\u001f2024-01-02T00:00:00Z\u001fSecond commit\u001e`
    const result = parseGitLogOutput(raw)
    expect(result).toHaveLength(2)
    expect(result[0].hash).toBe('abc123')
    expect(result[1].hash).toBe('def456')
  })

  it('preserves multi-line commit messages', () => {
    const raw = `abc123\u001fDevon Lane\u001fdevon@x.com\u001f2024-01-01T00:00:00Z\u001fSummary line\n\nBody paragraph explaining the change.\u001e`
    const result = parseGitLogOutput(raw)
    expect(result[0].message).toBe('Summary line\n\nBody paragraph explaining the change.')
  })

  it('exposes the expected format string', () => {
    expect(GIT_LOG_FORMAT).toContain('%H')
    expect(GIT_LOG_FORMAT).toContain('%B')
  })
})
