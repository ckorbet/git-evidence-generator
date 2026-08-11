import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { BrowserWindow, type WebContents } from 'electron'
import {
  assemblePersonReportData,
  buildReportLabels,
  buildReportOutputPath,
  renderReportHtml,
  scanRepositories
} from '@core/index'
import type { DateRange, GenerateReportResult, Profile, ScanProgressEvent } from '@core/index'
import { decryptSecret } from './credentialService'
import { appendHistoryEntry, getHistoryEntryOrThrow, updateHistoryEntryOutputFiles } from './historyStore'
import { loadSettings } from './settingsStore'
import { renderHtmlToPdf } from './pdfRenderer'

/** Broadcasts a scan-progress event to every renderer window (there is only ever one in v1). */
function broadcastProgress(event: ScanProgressEvent): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('report:progress', event)
  }
}

/**
 * Runs the full scan -> match -> filter -> render -> save pipeline for a profile and date
 * range, writes one PDF per tracked person with at least one matched commit, appends a
 * history entry capturing the exact snapshot used, and returns a summary for the UI.
 */
export async function generateReport(profile: Profile, dateRange: DateRange): Promise<GenerateReportResult> {
  const settings = await loadSettings()
  const outputDirectory = settings.outputDirectory
  const decryptedPat = profile.credential.encryptedPat
    ? decryptSecret(profile.credential.encryptedPat)
    : ''

  const scanResult = await scanRepositories({
    repositories: profile.repositories,
    credential: { username: profile.credential.username, pat: decryptedPat },
    dateFrom: dateRange.from,
    dateTo: dateRange.to,
    extensionWhitelist: profile.extensionWhitelist,
    onProgress: broadcastProgress
  })

  const reportLabels = buildReportLabels(settings.language)
  const perPersonData = assemblePersonReportData(
    scanResult,
    profile.people,
    profile.blacklistWords,
    profile.name,
    dateRange
  )

  const generatedFiles: Array<{ personDisplayName: string; filePath: string }> = []
  for (const personData of perPersonData) {
    const outputPath = buildReportOutputPath({
      outputDirectory,
      profileName: profile.name,
      personDisplayName: personData.person.displayName,
      dateFrom: dateRange.from,
      dateTo: dateRange.to
    })
    const html = renderReportHtml(personData, reportLabels)
    const pdfBuffer = await renderHtmlToPdf(html)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, pdfBuffer)
    generatedFiles.push({ personDisplayName: personData.person.displayName, filePath: outputPath })
  }

  const historyEntry = await appendHistoryEntry(
    profile.id,
    {
      profileId: profile.id,
      profileName: profile.name,
      repositories: profile.repositories,
      people: profile.people,
      blacklistWords: profile.blacklistWords,
      extensionWhitelist: profile.extensionWhitelist,
      dateRange
    },
    generatedFiles
  )

  return {
    generatedFiles,
    skippedBinaryFileCount: scanResult.skippedBinaryFiles.length,
    failedRepositories: scanResult.errors,
    historyEntryId: historyEntry.id
  }
}

/**
 * Re-runs the full pipeline using a past history entry's stored snapshot (not the profile's
 * current live configuration), so the regenerated PDF reproduces the original evidence even
 * if the profile has since been edited. The profile is only used to resolve the (possibly
 * still-current) credential, since credentials are not part of the snapshot.
 */
export async function regenerateReport(
  profile: Profile,
  historyEntryId: string
): Promise<GenerateReportResult> {
  const entry = await getHistoryEntryOrThrow(profile.id, historyEntryId)
  const settings = await loadSettings()
  const outputDirectory = settings.outputDirectory
  const decryptedPat = profile.credential.encryptedPat
    ? decryptSecret(profile.credential.encryptedPat)
    : ''

  const { snapshot } = entry
  const scanResult = await scanRepositories({
    repositories: snapshot.repositories,
    credential: { username: profile.credential.username, pat: decryptedPat },
    dateFrom: snapshot.dateRange.from,
    dateTo: snapshot.dateRange.to,
    extensionWhitelist: snapshot.extensionWhitelist,
    onProgress: broadcastProgress
  })

  const reportLabels = buildReportLabels(settings.language)
  const perPersonData = assemblePersonReportData(
    scanResult,
    snapshot.people,
    snapshot.blacklistWords,
    snapshot.profileName,
    snapshot.dateRange
  )

  const generatedFiles: Array<{ personDisplayName: string; filePath: string }> = []
  for (const personData of perPersonData) {
    const outputPath = buildReportOutputPath({
      outputDirectory,
      profileName: snapshot.profileName,
      personDisplayName: personData.person.displayName,
      dateFrom: snapshot.dateRange.from,
      dateTo: snapshot.dateRange.to
    })
    const html = renderReportHtml(personData, reportLabels)
    const pdfBuffer = await renderHtmlToPdf(html)
    await mkdir(dirname(outputPath), { recursive: true })
    await writeFile(outputPath, pdfBuffer)
    generatedFiles.push({ personDisplayName: personData.person.displayName, filePath: outputPath })
  }

  await updateHistoryEntryOutputFiles(profile.id, historyEntryId, generatedFiles)

  return {
    generatedFiles,
    skippedBinaryFileCount: scanResult.skippedBinaryFiles.length,
    failedRepositories: scanResult.errors,
    historyEntryId
  }
}

export type { WebContents }
