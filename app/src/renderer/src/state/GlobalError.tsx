import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

interface GlobalErrorValue {
  /** Surfaces a user-facing error message in the global banner. */
  showError: (message: string) => void
}

const GlobalErrorContext = createContext<GlobalErrorValue | null>(null)

/**
 * Provides a single, app-wide banner for surfacing IPC/report-generation failures to the
 * user, plus a safety-net `unhandledrejection` listener so any promise rejection that a
 * screen forgot to catch still reaches the user instead of silently vanishing into the
 * console.
 */
export function GlobalErrorProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { t } = useTranslation()
  const [message, setMessage] = useState<string | null>(null)

  const showError = useCallback((nextMessage: string) => {
    setMessage(nextMessage)
  }, [])

  useEffect(() => {
    function handleUnhandledRejection(event: PromiseRejectionEvent): void {
      const reasonMessage =
        event.reason instanceof Error ? event.reason.message : String(event.reason)
      setMessage(reasonMessage || t('errors.unexpected'))
    }
    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [t])

  const value = useMemo(() => ({ showError }), [showError])

  return (
    <GlobalErrorContext.Provider value={value}>
      {message && (
        <div className="global-error-banner" role="alert">
          <strong>{t('errors.title')}:</strong> <span>{message}</span>
          <button onClick={() => setMessage(null)}>{t('errors.dismiss')}</button>
        </div>
      )}
      {children}
    </GlobalErrorContext.Provider>
  )
}

export function useGlobalError(): GlobalErrorValue {
  const context = useContext(GlobalErrorContext)
  if (!context) throw new Error('useGlobalError must be used within a GlobalErrorProvider')
  return context
}
