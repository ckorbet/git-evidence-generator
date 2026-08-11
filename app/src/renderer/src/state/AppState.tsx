import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import type { AppSettings, Profile } from '@core/renderer-safe'

interface AppStateValue {
  settings: AppSettings | null
  profiles: Profile[]
  activeProfile: Profile | null
  loading: boolean
  refreshProfiles: () => Promise<void>
  refreshSettings: () => Promise<void>
  setActiveProfileId: (profileId: string | null) => Promise<void>
}

const AppStateContext = createContext<AppStateValue | null>(null)

/** Applies the appearance setting (system/dark/light) to the document root as a CSS class. */
function applyAppearance(appearance: AppSettings['appearance']): void {
  const root = document.documentElement
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  const resolved = appearance === 'system' ? (prefersDark ? 'dark' : 'light') : appearance
  root.setAttribute('data-theme', resolved)
}

export function AppStateProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const { i18n } = useTranslation()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)

  const refreshSettings = useCallback(async () => {
    const loaded = await window.api.settings.get()
    setSettings(loaded)
    applyAppearance(loaded.appearance)
    if (i18n.language !== loaded.language) await i18n.changeLanguage(loaded.language)
  }, [i18n])

  const refreshProfiles = useCallback(async () => {
    const loaded = await window.api.profiles.list()
    setProfiles(loaded)
  }, [])

  useEffect(() => {
    void (async () => {
      await Promise.all([refreshSettings(), refreshProfiles()])
      setLoading(false)
    })()
  }, [refreshSettings, refreshProfiles])

  const setActiveProfileId = useCallback(async (profileId: string | null) => {
    const updated = await window.api.settings.update({ activeProfileId: profileId })
    setSettings(updated)
  }, [])

  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === settings?.activeProfileId) ?? null,
    [profiles, settings]
  )

  // Re-resolve "System" appearance live when the OS theme changes, without requiring a restart.
  useEffect(() => {
    if (settings?.appearance !== 'system') return
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const handleChange = () => applyAppearance('system')
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [settings?.appearance])

  const value: AppStateValue = {
    settings,
    profiles,
    activeProfile,
    loading,
    refreshProfiles,
    refreshSettings,
    setActiveProfileId
  }

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}

export function useAppState(): AppStateValue {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used within an AppStateProvider')
  return context
}
