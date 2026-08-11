import type { RepositoryEntry } from '../types'

/**
 * Parses a profile's repository list textarea content, one repository per line, in the
 * format `<url> [branch]`. Blank lines are ignored.
 */
export function parseRepositoryList(rawText: string): RepositoryEntry[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parseRepositoryLine)
}

function parseRepositoryLine(line: string): RepositoryEntry {
  const parts = line.split(/\s+/)
  const [url, branch] = parts
  return branch ? { url, branch } : { url }
}

/**
 * Serializes repository entries back into the `<url> [branch]` textarea format,
 * one repository per line - the inverse of {@link parseRepositoryList}.
 */
export function serializeRepositoryList(repositories: RepositoryEntry[]): string {
  return repositories
    .map((repo) => (repo.branch ? `${repo.url} ${repo.branch}` : repo.url))
    .join('\n')
}
