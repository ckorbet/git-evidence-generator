import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppStateProvider, useAppState } from './state/AppState'
import { GlobalErrorProvider } from './state/GlobalError'
import { ProfileSelector } from './components/ProfileSelector'
import { DashboardScreen } from './screens/DashboardScreen'
import { ProfilesScreen } from './screens/ProfilesScreen'
import { GenerateReportScreen } from './screens/GenerateReportScreen'
import { SettingsScreen } from './screens/SettingsScreen'

type ScreenId = 'dashboard' | 'profiles' | 'generateReport' | 'settings'

function AppShell(): React.JSX.Element {
  const { t } = useTranslation()
  const { loading } = useAppState()
  const [screen, setScreen] = useState<ScreenId>('generateReport')

  if (loading) return <div className="loading-screen">…</div>

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="app-title">{t('app.name')}</h1>
        <ProfileSelector />
        <nav className="nav">
          <button
            className={screen === 'dashboard' ? 'nav-item active' : 'nav-item'}
            onClick={() => setScreen('dashboard')}
          >
            {t('nav.dashboard')}
          </button>
          <button
            className={screen === 'profiles' ? 'nav-item active' : 'nav-item'}
            onClick={() => setScreen('profiles')}
          >
            {t('nav.profiles')}
          </button>
          <button
            className={screen === 'generateReport' ? 'nav-item active' : 'nav-item'}
            onClick={() => setScreen('generateReport')}
          >
            {t('nav.generateReport')}
          </button>
          <button
            className={screen === 'settings' ? 'nav-item active' : 'nav-item'}
            onClick={() => setScreen('settings')}
          >
            {t('nav.settings')}
          </button>
        </nav>
      </aside>
      <main className="main-content">
        {screen === 'dashboard' && <DashboardScreen />}
        {screen === 'profiles' && <ProfilesScreen />}
        {screen === 'generateReport' && <GenerateReportScreen />}
        {screen === 'settings' && <SettingsScreen />}
      </main>
    </div>
  )
}

export default function App(): React.JSX.Element {
  return (
    <AppStateProvider>
      <GlobalErrorProvider>
        <AppShell />
      </GlobalErrorProvider>
    </AppStateProvider>
  )
}
