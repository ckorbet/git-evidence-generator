import type { TrackedPerson } from '../types'

/**
 * Parses a profile's "tracked people" textarea content, one person per line, in the
 * format `Display Name: alias1, alias2, ...`. Blank lines are ignored. A line without
 * a `:` separator is treated as a display name with no aliases (matches nothing).
 */
export function parseTrackedPeople(rawText: string): TrackedPerson[] {
  return rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map(parsePersonLine)
}

function parsePersonLine(line: string): TrackedPerson {
  const separatorIndex = line.indexOf(':')
  if (separatorIndex === -1) {
    return { displayName: line.trim(), aliases: [] }
  }

  const displayName = line.slice(0, separatorIndex).trim()
  const aliasesPart = line.slice(separatorIndex + 1)
  const aliases = aliasesPart
    .split(',')
    .map((alias) => alias.trim())
    .filter((alias) => alias.length > 0)

  return { displayName, aliases }
}

/**
 * Serializes tracked people back into the `Display Name: alias1, alias2` textarea format,
 * one person per line - the inverse of {@link parseTrackedPeople}.
 */
export function serializeTrackedPeople(people: TrackedPerson[]): string {
  return people.map((person) => `${person.displayName}: ${person.aliases.join(', ')}`).join('\n')
}
