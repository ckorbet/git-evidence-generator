import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HistoryEntry } from '@core/renderer-safe'
import { useAppState } from '../state/AppState'
import { useGlobalError } from '../state/GlobalError'

export function DashboardScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { activeProfile } = useAppState()
  const { showError } = useGlobalError()
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [missingByFile, setMissingByFile] = useState<Record<string, boolean>>({})
  const [regenerating, setRegenerating] = useState<string | null>(null)

  useEffect(() => {
    if (!activeProfile) return
    let cancelled = false
    void (async () => {
      const history = await window.api.history.list(activeProfile.id)
      if (cancelled) return
      setEntries(history)
      const checks: Record<string, boolean> = {}
      for (const entry of history) {
        for (const file of entry.outputFiles) {
          checks[file.filePath] = await window.api.history.checkFileExists(file.filePath)
        }
      }
      if (!cancelled) setMissingByFile(checks)
    })()
    return () => {
      cancelled = true
    }
    // Only re-run when the active profile's id changes, not on every object identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeProfile?.id])

  async function handleRegenerate(entryId: string): Promise<void> {
    if (!activeProfile) return
    setRegenerating(entryId)
    try {
      await window.api.report.regenerate({ profileId: activeProfile.id, historyEntryId: entryId })
      const refreshed = await window.api.history.list(activeProfile.id)
      setEntries(refreshed)
    } catch (error) {
      showError((error as Error).message || t('errors.unexpected'))
    } finally {
      setRegenerating(null)
    }
  }

  if (!activeProfile) {
    return (
      <div className="dashboard-screen">
        <h2>{t('dashboard.title')}</h2>
        <p className="empty-state">{t('profileSelector.createFirst')}</p>
      </div>
    )
  }

  return (
    <div className="dashboard-screen">
      <h2>{t('dashboard.title')}</h2>
      {entries.length === 0 && <p className="empty-state">{t('dashboard.historyEmpty')}</p>}
      <ul className="history-list">
        {entries.map((entry) => (
          <li key={entry.id} className="history-entry">
            <div className="history-entry-header">
              <span>
                {t('dashboard.generatedOn')}: {new Date(entry.createdAt).toLocaleString()}
              </span>
            </div>
            <ul>
              {entry.outputFiles.map((file: HistoryEntry['outputFiles'][number]) => {
                const exists = missingByFile[file.filePath] !== false
                return (
                  <li key={file.filePath}>
                    <span>{file.personDisplayName}</span>
                    {exists ? (
                      <button onClick={() => void window.api.report.openFile(file.filePath)}>
                        {t('dashboard.open')}
                      </button>
                    ) : (
                      <span className="file-missing">{t('dashboard.fileMissing')}</span>
                    )}
                  </li>
                )
              })}
            </ul>
            <button disabled={regenerating === entry.id} onClick={() => void handleRegenerate(entry.id)}>
              {t('dashboard.regenerate')}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
