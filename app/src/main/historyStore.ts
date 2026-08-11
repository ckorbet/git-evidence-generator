import { access } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type { HistoryEntry, ReportRunSnapshot } from '@core/index'
import { readJsonFile, writeJsonFileAtomic } from '@core/index'
import { historyFilePath } from './paths'

/** Reads a profile's full history list, newest entries first. */
export async function listHistory(profileId: string): Promise<HistoryEntry[]> {
  const entries = await readJsonFile<HistoryEntry[]>(historyFilePath(profileId), [])
  return [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

/** Appends a new history entry after a successful (or partially successful) report-generation run. */
export async function appendHistoryEntry(
  profileId: string,
  snapshot: ReportRunSnapshot,
  outputFiles: Array<{ personDisplayName: string; filePath: string }>
): Promise<HistoryEntry> {
  const entries = await readJsonFile<HistoryEntry[]>(historyFilePath(profileId), [])
  const entry: HistoryEntry = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    snapshot,
    outputFiles
  }
  await writeJsonFileAtomic(historyFilePath(profileId), [...entries, entry])
  return entry
}

/**
 * Updates the `outputFiles` of an existing history entry (used after a snapshot-based
 * regeneration produces a fresh PDF at the same or a new location).
 */
export async function updateHistoryEntryOutputFiles(
  profileId: string,
  historyEntryId: string,
  outputFiles: Array<{ personDisplayName: string; filePath: string }>
): Promise<void> {
  const entries = await readJsonFile<HistoryEntry[]>(historyFilePath(profileId), [])
  const updated = entries.map((entry) =>
    entry.id === historyEntryId ? { ...entry, outputFiles } : entry
  )
  await writeJsonFileAtomic(historyFilePath(profileId), updated)
}

export class HistoryEntryNotFoundError extends Error {
  constructor(profileId: string, historyEntryId: string) {
    super(`History entry "${historyEntryId}" was not found for profile "${profileId}".`)
    this.name = 'HistoryEntryNotFoundError'
  }
}

/** Loads a single history entry by id, throwing if it does not exist. */
export async function getHistoryEntryOrThrow(
  profileId: string,
  historyEntryId: string
): Promise<HistoryEntry> {
  const entries = await readJsonFile<HistoryEntry[]>(historyFilePath(profileId), [])
  const entry = entries.find((candidate) => candidate.id === historyEntryId)
  if (!entry) throw new HistoryEntryNotFoundError(profileId, historyEntryId)
  return entry
}

/** Returns whether the file at `filePath` still exists on disk. */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}
