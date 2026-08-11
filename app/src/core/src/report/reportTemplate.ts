import type { PersonReportData } from '../types'

/** Localized label set required to render a report; supplied by the caller (via i18next). */
export interface ReportLabels {
  title: string
  generatedOn: string
  dateRange: string
  totalCommits: string
  repositoriesTouched: string
  linesAdded: string
  linesRemoved: string
  failedRepositories: string
  skippedBinaryFiles: string
  indexSectionTitle: string
  detailSectionTitle: string
  author: string
  noFailedRepositories: string
  noSkippedFiles: string
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function renderCoverPage(data: PersonReportData, labels: ReportLabels): string {
  return `
    <section class="cover-page">
      <h1>${labels.title.replace('{{person}}', escapeHtml(data.person.displayName))}</h1>
      <p class="meta">${labels.generatedOn}: ${escapeHtml(new Date(data.generatedAt).toLocaleString())}</p>
      <p class="meta">${labels.dateRange}: ${escapeHtml(data.dateRange.from)} &ndash; ${escapeHtml(data.dateRange.to)}</p>
      <table class="summary-table">
        <tr><td>${labels.totalCommits}</td><td>${data.commits.length}</td></tr>
        <tr><td>${labels.repositoriesTouched}</td><td>${data.repositoriesTouched.length}</td></tr>
        <tr><td>${labels.linesAdded}</td><td class="added">+${data.totalLinesAdded}</td></tr>
        <tr><td>${labels.linesRemoved}</td><td class="removed">-${data.totalLinesRemoved}</td></tr>
      </table>
      <h3>${labels.failedRepositories}</h3>
      ${
        data.failedRepositories.length > 0
          ? `<ul>${data.failedRepositories.map((failure) => `<li>${escapeHtml(failure.repositoryUrl)}: ${escapeHtml(failure.message)}</li>`).join('')}</ul>`
          : `<p class="muted">${labels.noFailedRepositories}</p>`
      }
      <h3>${labels.skippedBinaryFiles}</h3>
      ${
        data.skippedBinaryFiles.length > 0
          ? `<ul>${data.skippedBinaryFiles.map((skipped) => `<li>${escapeHtml(skipped.path)} (${escapeHtml(skipped.commitHash.slice(0, 8))})</li>`).join('')}</ul>`
          : `<p class="muted">${labels.noSkippedFiles}</p>`
      }
    </section>
    <div class="page-break"></div>
  `
}

function renderIndexSection(data: PersonReportData, labels: ReportLabels): string {
  const byRepository = groupCommitsByRepository(data)
  const sections = Array.from(byRepository.entries())
    .map(
      ([repositoryUrl, commits]) => `
        <h3>${escapeHtml(repositoryUrl)}</h3>
        <ul class="commit-index">
          ${commits
            .map(
              (commit) => `
                <li>
                  <span class="commit-message">${escapeHtml(commit.message.split('\n')[0])}</span>
                  <span class="commit-hash">${escapeHtml(commit.hash.slice(0, 10))}</span>
                </li>`
            )
            .join('')}
        </ul>`
    )
    .join('')

  return `
    <section class="index-section">
      <h2>${labels.indexSectionTitle}</h2>
      ${sections}
    </section>
    <div class="page-break"></div>
  `
}

function renderDetailSection(data: PersonReportData, labels: ReportLabels): string {
  const byRepository = groupCommitsByRepository(data)
  const sections = Array.from(byRepository.entries())
    .map(
      ([repositoryUrl, commits]) => `
        <h3>${escapeHtml(repositoryUrl)}</h3>
        ${commits.map((commit) => renderCommitDetail(commit, labels)).join('')}`
    )
    .join('')

  return `
    <section class="detail-section">
      <h2>${labels.detailSectionTitle}</h2>
      ${sections}
    </section>
  `
}

function renderCommitDetail(commit: PersonReportData['commits'][number], labels: ReportLabels): string {
  const fileBlocks = commit.fileDiffs
    .map(
      (file) => `
        <div class="file-diff">
          <div class="file-path">${escapeHtml(file.path)}</div>
          ${file.lines
            .map(
              (line) =>
                `<div class="diff-line diff-${line.kind}">${escapeHtml(line.text) || '&nbsp;'}</div>`
            )
            .join('')}
        </div>`
    )
    .join('')

  return `
    <div class="commit-detail">
      <div class="commit-header">
        <span class="commit-author">${labels.author}: ${escapeHtml(commit.authorName)}</span>
        <span class="commit-date">${escapeHtml(new Date(commit.authorDate).toLocaleString())}</span>
      </div>
      <div class="commit-message">${escapeHtml(commit.message)}</div>
      ${fileBlocks}
    </div>
  `
}

function groupCommitsByRepository(
  data: PersonReportData
): Map<string, PersonReportData['commits']> {
  const map = new Map<string, PersonReportData['commits']>()
  for (const commit of data.commits) {
    const existing = map.get(commit.repositoryUrl)
    if (existing) {
      existing.push(commit)
    } else {
      map.set(commit.repositoryUrl, [commit])
    }
  }
  return map
}

const REPORT_STYLES = `
  body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 0; padding: 0; }
  h1 { font-size: 20pt; }
  h2 { font-size: 16pt; border-bottom: 1px solid #ccc; padding-bottom: 4px; }
  h3 { font-size: 13pt; color: #444; }
  .cover-page, .index-section, .detail-section { padding: 40px 50px 60px 40px; }
  .meta { color: #777; font-size: 10pt; }
  .summary-table { border-collapse: collapse; margin: 16px 0; }
  .summary-table td { padding: 4px 12px 4px 0; font-size: 11pt; }
  .added { color: #1a7f37; }
  .removed { color: #cf222e; }
  .muted { color: #999; font-style: italic; }
  .commit-index { list-style: none; padding: 0; }
  .commit-index li { padding: 6px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between; font-size: 10pt; }
  .commit-hash { color: #888; font-family: 'Consolas', monospace; font-size: 9pt; }
  .commit-detail { margin-bottom: 24px; border-top: 1px solid #ddd; padding-top: 10px; }
  .commit-header { color: #777; font-size: 10pt; display: flex; justify-content: space-between; }
  .commit-message { font-size: 11pt; margin: 4px 0 8px; font-weight: bold; }
  .file-path { font-weight: bold; font-size: 9pt; margin: 8px 0 2px; }
  .diff-line { font-family: 'Consolas', monospace; font-size: 8pt; white-space: pre-wrap; padding: 1px 4px; }
  .diff-add { background-color: #98fb98; }
  .diff-remove { background-color: #ffa07a; }
  .diff-context { background-color: #f0f0f0; }
  .diff-header { background-color: #ddeeff; font-weight: bold; }
  .page-break { page-break-after: always; }
`

/**
 * Renders a full standalone HTML document for a single person's report, ready to be
 * loaded into an offscreen BrowserWindow and printed to PDF.
 */
export function renderReportHtml(data: PersonReportData, labels: ReportLabels): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(labels.title.replace('{{person}}', data.person.displayName))}</title>
    <style>${REPORT_STYLES}</style>
  </head>
  <body>
    ${renderCoverPage(data, labels)}
    ${renderIndexSection(data, labels)}
    ${renderDetailSection(data, labels)}
  </body>
</html>`
}
