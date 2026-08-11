import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { GenerateReportResult, ScanProgressEvent } from '@core/renderer-safe'
import { useAppState } from '../state/AppState'
import { useGlobalError } from '../state/GlobalError'

export function GenerateReportScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeProfile } = useAppState()
  const { showError } = useGlobalError()
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [progressLog, setProgressLog] = useState<ScanProgressEvent[]>([])
  const [result, setResult] = useState<GenerateReportResult | null>(null)

  useEffect(() => {
    return window.api.report.onProgress((event: ScanProgressEvent) => {
      setProgressLog((log) => [...log, event])
    })
  }, [])

  async function handleGenerate(): Promise<void> {
    if (!activeProfile) return
    setGenerating(true)
    setProgressLog([])
    setResult(null)
    try {
      const generated = await window.api.report.generate({
        profileId: activeProfile.id,
        dateRange: { from: dateFrom, to: dateTo }
      })
      setResult(generated)
    } catch (error) {
      showError((error as Error).message || t('errors.unexpected'))
    } finally {
      setGenerating(false)
    }
  }

  if (!activeProfile) {
    return (
      <div className="generate-report-screen">
        <h2>{t('generateReport.title')}</h2>
        <p className="empty-state">{t('generateReport.noProfileSelected')}</p>
      </div>
    )
  }

  return (
    <div className="generate-report-screen">
      <h2>{t('generateReport.title')}</h2>
      <div className="date-range-inputs">
        <label>
          {t('generateReport.dateFrom')}
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label>
          {t('generateReport.dateTo')}
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <button disabled={generating || !dateFrom || !dateTo} onClick={() => void handleGenerate()}>
          {generating ? t('generateReport.generating') : t('generateReport.generate')}
        </button>
      </div>

      {progressLog.length > 0 && (
        <ul className="progress-log">
          {progressLog.map((event, index) => (
            <li key={index}>
              {event.repositoryUrl}: {t(`generateReport.progress${capitalize(event.stage)}`)}
              {event.message ? ` — ${event.message}` : ''}
            </li>
          ))}
        </ul>
      )}

      {result && (
        <div className="generation-summary">
          <h3>{t('generateReport.summaryTitle')}</h3>
          <p>{t('generateReport.summaryFilesGenerated', { count: result.generatedFiles.length })}</p>
          {result.skippedBinaryFileCount > 0 && (
            <p>{t('generateReport.summarySkippedBinary', { count: result.skippedBinaryFileCount })}</p>
          )}
          {result.failedRepositories.length > 0 && (
            <p>{t('generateReport.summaryFailedRepositories', { count: result.failedRepositories.length })}</p>
          )}
        </div>
      )}
    </div>
  )
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}
