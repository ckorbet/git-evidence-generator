/**
 * Shared domain types for the Git Evidence Generator "core" package.
 * This module has no dependency on Electron, Node's fs, or React — it is
 * pure data-shape definitions reused by main, preload, and renderer code.
 */

/** A single repository entry parsed from a profile's repository list. */
export interface RepositoryEntry {
  /** Raw repository URL (HTTPS), as configured by the user. */
  url: string
  /** Optional branch to scan; when omitted, the repository's default branch is used. */
  branch?: string
}

/** A tracked person and the aliases used to attribute commits to them. */
export interface TrackedPerson {
  /** Canonical display name, used in report titles and output file names. */
  displayName: string
  /** Case-insensitive aliases (email addresses or username fragments) to match against commit authors. */
  aliases: string[]
}

/** Git credential used to authenticate all repositories within a profile. */
export interface GitCredential {
  username: string
  /** Encrypted (base64) Personal Access Token, as produced by the credential service. Empty string if unset. */
  encryptedPat: string
}

/** Full, persisted configuration for a single profile. */
export interface Profile {
  id: string
  name: string
  /** One repository entry per configured repository line. */
  repositories: RepositoryEntry[]
  /** One tracked person per configured people line. */
  people: TrackedPerson[]
  /** Blacklist words to redact (case-insensitive, literal match). */
  blacklistWords: string[]
  /** File-extension whitelist (e.g. [".ts", ".js"]); empty array means "include all extensions". */
  extensionWhitelist: string[]
  credential: GitCredential
  createdAt: string
  updatedAt: string
}

/** Application-wide settings, persisted separately from profiles. */
export interface AppSettings {
  appearance: 'system' | 'dark' | 'light'
  language: 'en' | 'es'
  /** Absolute path to the default output directory for generated PDFs. */
  outputDirectory: string
  /** id of the profile currently marked "active" (selected in the sidebar). */
  activeProfileId: string | null
}

/** The date range requested for a single report-generation run. */
export interface DateRange {
  /** Inclusive start date, ISO 8601 (YYYY-MM-DD). */
  from: string
  /** Inclusive end date, ISO 8601 (YYYY-MM-DD). */
  to: string
}

/** A single line of unified diff content, classified for rendering purposes. */
export type DiffLineKind = 'add' | 'remove' | 'context' | 'header'

export interface DiffLine {
  kind: DiffLineKind
  text: string
}

/** A single file's filtered diff within a commit. */
export interface FileDiff {
  path: string
  lines: DiffLine[]
}

/** A file that was detected as binary and excluded from diff rendering. */
export interface SkippedBinaryFile {
  repositoryUrl: string
  commitHash: string
  path: string
}

/** A single scanned commit, already attributed to a tracked person. */
export interface ScannedCommit {
  repositoryUrl: string
  hash: string
  authorName: string
  authorEmail: string
  authorDate: string
  message: string
  fileDiffs: FileDiff[]
  linesAdded: number
  linesRemoved: number
}

/** A repository-level failure recorded during a scan, without aborting the run. */
export interface RepositoryScanError {
  repositoryUrl: string
  message: string
}

/** Aggregate scan output for one profile's repositories, before identity matching. */
export interface RepositoryScanResult {
  commits: ScannedCommit[]
  skippedBinaryFiles: SkippedBinaryFile[]
  errors: RepositoryScanError[]
}

/** Commits and stats attributed to a single tracked person, ready for report rendering. */
export interface PersonReportData {
  person: TrackedPerson
  profileName: string
  dateRange: DateRange
  commits: ScannedCommit[]
  repositoriesTouched: string[]
  totalLinesAdded: number
  totalLinesRemoved: number
  skippedBinaryFiles: SkippedBinaryFile[]
  failedRepositories: RepositoryScanError[]
  generatedAt: string
}

/** A snapshot of every parameter used for one report-generation run, stored in history. */
export interface ReportRunSnapshot {
  profileId: string
  profileName: string
  repositories: RepositoryEntry[]
  people: TrackedPerson[]
  blacklistWords: string[]
  extensionWhitelist: string[]
  dateRange: DateRange
}

/** One entry in a profile's report-generation history. */
export interface HistoryEntry {
  id: string
  createdAt: string
  snapshot: ReportRunSnapshot
  /** Output PDF file paths produced by this run, one per person who had matched commits. */
  outputFiles: Array<{ personDisplayName: string; filePath: string }>
}

/** Live progress event for a single repository during a scan, streamed to the renderer. */
export interface ScanProgressEvent {
  repositoryUrl: string
  stage: 'cloning' | 'scanning' | 'done' | 'failed'
  message?: string
}
