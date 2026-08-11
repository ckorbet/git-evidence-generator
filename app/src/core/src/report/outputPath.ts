import { join } from 'node:path'

/** Characters that are invalid in Windows and/or macOS file/folder names. */
// eslint-disable-next-line no-control-regex -- control characters (0x00-0x1f) are intentionally invalid in filenames
const INVALID_FILENAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g

/** Sanitizes a string for safe use as a file or folder name component. */
export function sanitizeForFilename(value: string): string {
  return value.replace(INVALID_FILENAME_CHARS, '_').trim()
}

/**
 * Builds the deterministic output path for a person's generated PDF report:
 * `<outputDirectory>/<ProfileName>/<ProfileName>_<PersonName>_<From>-<To>.pdf`.
 */
export function buildReportOutputPath(params: {
  outputDirectory: string
  profileName: string
  personDisplayName: string
  dateFrom: string
  dateTo: string
}): string {
  const safeProfile = sanitizeForFilename(params.profileName)
  const safePerson = sanitizeForFilename(params.personDisplayName)
  const fileName = `${safeProfile}_${safePerson}_${params.dateFrom}-${params.dateTo}.pdf`
  return join(params.outputDirectory, safeProfile, fileName)
}
