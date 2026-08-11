import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReportRunSnapshot } from '@core/index'

let testUserDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: () => testUserDataDir
  }
}))

const snapshot: ReportRunSnapshot = {
  profileId: 'profile-1',
  profileName: 'Team Alpha',
  repositories: [{ url: 'https://github.com/org/repo.git' }],
  people: [{ displayName: 'Devon Lane', aliases: ['devon@x.com'] }],
  blacklistWords: [],
  extensionWhitelist: ['.ts'],
  dateRange: { from: '2024-01-01', to: '2024-01-31' }
}

describe('historyStore', () => {
  beforeEach(async () => {
    testUserDataDir = await mkdtemp(join(tmpdir(), 'gitevidence-history-'))
  })

  afterEach(async () => {
    await rm(testUserDataDir, { recursive: true, force: true })
  })

  it('appends a history entry capturing the full run snapshot and output files', async () => {
    const { appendHistoryEntry, listHistory } = await import('./historyStore')
    await appendHistoryEntry('profile-1', snapshot, [
      { personDisplayName: 'Devon Lane', filePath: 'C:\\out\\report.pdf' }
    ])
    const entries = await listHistory('profile-1')
    expect(entries).toHaveLength(1)
    expect(entries[0].snapshot).toEqual(snapshot)
    expect(entries[0].outputFiles[0].filePath).toBe('C:\\out\\report.pdf')
  })

  it('lists history entries newest first', async () => {
    const { appendHistoryEntry, listHistory } = await import('./historyStore')
    const first = await appendHistoryEntry('profile-1', snapshot, [])
    await new Promise((resolve) => setTimeout(resolve, 5))
    const second = await appendHistoryEntry('profile-1', snapshot, [])
    const entries = await listHistory('profile-1')
    expect(entries[0].id).toBe(second.id)
    expect(entries[1].id).toBe(first.id)
  })

  it('updates output files of an existing entry after regeneration', async () => {
    const { appendHistoryEntry, updateHistoryEntryOutputFiles, listHistory } = await import(
      './historyStore'
    )
    const entry = await appendHistoryEntry('profile-1', snapshot, [
      { personDisplayName: 'Devon Lane', filePath: 'C:\\old\\report.pdf' }
    ])
    await updateHistoryEntryOutputFiles('profile-1', entry.id, [
      { personDisplayName: 'Devon Lane', filePath: 'C:\\new\\report.pdf' }
    ])
    const entries = await listHistory('profile-1')
    expect(entries[0].outputFiles[0].filePath).toBe('C:\\new\\report.pdf')
  })

  it('detects whether an output file still exists on disk', async () => {
    const { fileExists } = await import('./historyStore')
    expect(await fileExists(join(testUserDataDir, 'does-not-exist.pdf'))).toBe(false)
  })
})
