const UNIT_SEPARATOR = '\u001f'
const RECORD_SEPARATOR = '\u001e'

export const GIT_LOG_FORMAT = `%H${UNIT_SEPARATOR}%an${UNIT_SEPARATOR}%ae${UNIT_SEPARATOR}%aI${UNIT_SEPARATOR}%B${RECORD_SEPARATOR}`

export interface ParsedLogEntry {
  hash: string
  authorName: string
  authorEmail: string
  authorDateIso: string
  message: string
}

/**
 * Parses `git log` output produced using {@link GIT_LOG_FORMAT}, where each commit
 * record is separated by a record-separator control character and each field within
 * a record by a unit-separator control character - delimiters chosen specifically
 * because they cannot appear in ordinary commit messages, unlike `|` or `,`.
 */
export function parseGitLogOutput(rawOutput: string): ParsedLogEntry[] {
  return rawOutput
    .split(RECORD_SEPARATOR)
    .map((record) => record.replace(/^\r?\n/, '').trim())
    .filter((record) => record.length > 0)
    .map((record) => {
      const [hash, authorName, authorEmail, authorDateIso, ...messageParts] =
        record.split(UNIT_SEPARATOR)
      return {
        hash,
        authorName,
        authorEmail,
        authorDateIso,
        message: messageParts.join(UNIT_SEPARATOR).trim()
      }
    })
}
