import type { ReportLabels } from '../report/reportTemplate'
import { en, es } from './resources'

/** Builds the `ReportLabels` set consumed by `renderReportHtml` for the given active language. */
export function buildReportLabels(language: 'en' | 'es'): ReportLabels {
  const t = language === 'es' ? es.report : en.report
  return {
    title: t.title,
    generatedOn: t.generatedOn,
    dateRange: t.dateRange,
    totalCommits: t.totalCommits,
    repositoriesTouched: t.repositoriesTouched,
    linesAdded: t.linesAdded,
    linesRemoved: t.linesRemoved,
    failedRepositories: t.failedRepositories,
    skippedBinaryFiles: t.skippedBinaryFiles,
    indexSectionTitle: t.indexSectionTitle,
    detailSectionTitle: t.detailSectionTitle,
    author: t.author,
    noFailedRepositories: t.noFailedRepositories,
    noSkippedFiles: t.noSkippedFiles
  }
}
