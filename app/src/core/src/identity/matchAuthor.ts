import type { ScannedCommit, TrackedPerson } from '../types'

interface CommitAuthor {
  authorName: string
  authorEmail: string
}

/**
 * Matches a commit's author (name + email) against every tracked person's aliases,
 * case-insensitively. An alias matches if it equals, or appears as a substring within,
 * the author's name or email. Returns the first matching person, or `null` if none match.
 *
 * Matching by substring (rather than requiring an exact email match) lets a single
 * alias such as a username fragment (e.g. "dl-dev") match author strings that embed it,
 * such as noreply emails (e.g. "12345+dl-dev@users.noreply.github.com").
 */
export function matchAuthorToPerson(
  author: CommitAuthor,
  people: TrackedPerson[]
): TrackedPerson | null {
  const name = author.authorName.toLowerCase()
  const email = author.authorEmail.toLowerCase()

  for (const person of people) {
    for (const alias of person.aliases) {
      const normalizedAlias = alias.trim().toLowerCase()
      if (normalizedAlias.length === 0) continue
      if (name.includes(normalizedAlias) || email.includes(normalizedAlias)) {
        return person
      }
    }
  }

  return null
}

/**
 * Groups scanned commits by their matched tracked person, dropping any commit that
 * does not match a tracked person. The returned map preserves each person's original
 * object identity as the key's associated person and the commits in scan order.
 */
export function groupCommitsByPerson(
  commits: ScannedCommit[],
  people: TrackedPerson[]
): Map<TrackedPerson, ScannedCommit[]> {
  const grouped = new Map<TrackedPerson, ScannedCommit[]>()

  for (const commit of commits) {
    const person = matchAuthorToPerson(
      { authorName: commit.authorName, authorEmail: commit.authorEmail },
      people
    )
    if (!person) continue

    const existing = grouped.get(person)
    if (existing) {
      existing.push(commit)
    } else {
      grouped.set(person, [commit])
    }
  }

  return grouped
}
