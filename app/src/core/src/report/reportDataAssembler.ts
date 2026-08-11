import type {
  PersonReportData,
  DateRange,
  RepositoryScanError,
  RepositoryScanResult,
  ScannedCommit,
  SkippedBinaryFile,
  TrackedPerson
} from '../types'
import { groupCommitsByPerson } from '../identity/matchAuthor'
import { redactBlacklistWords } from '../filtering/blacklistRedaction'

/**
 * Applies blacklist redaction to a commit's message, file paths, and diff line content.
 * Returns a new commit object; the input is never mutated.
 */
function redactCommit(commit: ScannedCommit, blacklistWords: string[]): ScannedCommit {
  return {
    ...commit,
    message: redactBlacklistWords(commit.message, blacklistWords),
    fileDiffs: commit.fileDiffs.map((file) => ({
      path: redactBlacklistWords(file.path, blacklistWords),
      lines: file.lines.map((line) => ({
        ...line,
        text: redactBlacklistWords(line.text, blacklistWords)
      }))
    }))
  }
}

/**
 * Assembles per-person report data from a raw repository scan result: matches commits
 * to tracked people, applies blacklist redaction, and computes summary statistics
 * (commit counts, repositories touched, lines added/removed) for each person who has
 * at least one matched commit.
 */
export function assemblePersonReportData(
  scanResult: RepositoryScanResult,
  people: TrackedPerson[],
  blacklistWords: string[],
  profileName: string,
  dateRange: DateRange
): PersonReportData[] {
  const redactedCommits = scanResult.commits.map((commit) => redactCommit(commit, blacklistWords))
  const grouped = groupCommitsByPerson(redactedCommits, people)
  const generatedAt = new Date().toISOString()

  const results: PersonReportData[] = []
  for (const [person, commits] of grouped) {
    results.push(
      buildPersonReportData(
        person,
        commits,
        scanResult.skippedBinaryFiles,
        scanResult.errors,
        profileName,
        dateRange,
        generatedAt
      )
    )
  }

  return results
}

function buildPersonReportData(
  person: TrackedPerson,
  commits: ScannedCommit[],
  allSkippedBinaryFiles: SkippedBinaryFile[],
  errors: RepositoryScanError[],
  profileName: string,
  dateRange: DateRange,
  generatedAt: string
): PersonReportData {
  const repositoriesTouched = Array.from(new Set(commits.map((commit) => commit.repositoryUrl)))
  const relevantSkipped = allSkippedBinaryFiles.filter((file) =>
    repositoriesTouched.includes(file.repositoryUrl)
  )

  return {
    person,
    profileName,
    dateRange,
    commits,
    repositoriesTouched,
    totalLinesAdded: commits.reduce((sum, commit) => sum + commit.linesAdded, 0),
    totalLinesRemoved: commits.reduce((sum, commit) => sum + commit.linesRemoved, 0),
    skippedBinaryFiles: relevantSkipped,
    failedRepositories: errors,
    generatedAt
  }
}
