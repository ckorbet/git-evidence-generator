import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Profile } from '@core/index'

let testUserDataDir: string

vi.mock('electron', () => ({
  app: { getPath: () => testUserDataDir },
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (plaintext: string) => Buffer.from(plaintext),
    decryptString: (buffer: Buffer) => buffer.toString()
  },
  BrowserWindow: { getAllWindows: () => [] }
}))

vi.mock('./pdfRenderer', () => ({
  renderHtmlToPdf: vi.fn(async () => Buffer.from('pdf-bytes'))
}))

// Records the repositories/people/date-range actually passed to scanRepositories on each call,
// so the test can assert that regeneration used the stored snapshot rather than the live profile.
const scanCalls: unknown[] = []

vi.mock('@core/index', async () => {
  const actual = await vi.importActual<typeof import('@core/index')>('@core/index')
  return {
    ...actual,
    scanRepositories: vi.fn(async (options: unknown) => {
      scanCalls.push(options)
      return {
        commits: [],
        skippedBinaryFiles: [],
        errors: []
      }
    })
  }
})

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'profile-1',
    name: 'Live Profile Name',
    repositories: [{ url: 'https://github.com/org/live-repo.git' }],
    people: [{ displayName: 'Live Person', aliases: ['live@x.com'] }],
    blacklistWords: [],
    extensionWhitelist: ['.ts'],
    credential: { username: 'user', encryptedPat: '' },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    ...overrides
  }
}

describe('reportGenerator.regenerateReport', () => {
  beforeEach(async () => {
    testUserDataDir = await mkdtemp(join(tmpdir(), 'gitevidence-reportgen-'))
    scanCalls.length = 0
  })

  afterEach(async () => {
    await rm(testUserDataDir, { recursive: true, force: true })
  })

  it('re-runs the scan using the history entry snapshot, not the current (edited) profile', async () => {
    const { appendHistoryEntry } = await import('./historyStore')
    const { regenerateReport } = await import('./reportGenerator')

    // The snapshot reflects a repository/people configuration that has since diverged
    // from the profile's current, live configuration below.
    const snapshotRepositories = [{ url: 'https://github.com/org/original-repo.git' }]
    const snapshotPeople = [{ displayName: 'Original Person', aliases: ['original@x.com'] }]
    const historyEntry = await appendHistoryEntry(
      'profile-1',
      {
        profileId: 'profile-1',
        profileName: 'Original Profile Name',
        repositories: snapshotRepositories,
        people: snapshotPeople,
        blacklistWords: [],
        extensionWhitelist: ['.ts'],
        dateRange: { from: '2024-01-01', to: '2024-01-31' }
      },
      [{ personDisplayName: 'Original Person', filePath: join(testUserDataDir, 'old-report.pdf') }]
    )

    // The live profile has since been edited: different name, repository, and tracked person.
    const liveProfile = makeProfile()

    const result = await regenerateReport(liveProfile, historyEntry.id)

    expect(scanCalls).toHaveLength(1)
    const usedOptions = scanCalls[0] as { repositories: unknown; dateFrom: string; dateTo: string }
    // The scan must have used the snapshot's repository and date range, not the live profile's.
    expect(usedOptions.repositories).toEqual(snapshotRepositories)
    expect(usedOptions.dateFrom).toBe('2024-01-01')
    expect(usedOptions.dateTo).toBe('2024-01-31')
    expect(result.historyEntryId).toBe(historyEntry.id)
  })
})
