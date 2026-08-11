import { useTranslation } from 'react-i18next'
import type { AppSettings } from '@core/renderer-safe'
import { useAppState } from '../state/AppState'

export function SettingsScreen(): React.JSX.Element {
  const { t, i18n } = useTranslation()
  const { settings, refreshSettings } = useAppState()

  if (!settings) return <div className="settings-screen" />

  async function update(patch: Partial<AppSettings>): Promise<void> {
    await window.api.settings.update(patch)
    if (patch.language) await i18n.changeLanguage(patch.language)
    await refreshSettings()
  }

  async function handleChooseFolder(): Promise<void> {
    const chosen = await window.api.settings.chooseOutputDirectory()
    if (chosen) await update({ outputDirectory: chosen })
  }

  return (
    <div className="settings-screen">
      <h2>{t('settings.title')}</h2>

      <fieldset>
        <legend>{t('settings.appearance')}</legend>
        {(['system', 'dark', 'light'] as const).map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="appearance"
              checked={settings.appearance === option}
              onChange={() => void update({ appearance: option })}
            />
            {t(`settings.appearance${option.charAt(0).toUpperCase()}${option.slice(1)}`)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t('settings.language')}</legend>
        {(['en', 'es'] as const).map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="language"
              checked={settings.language === option}
              onChange={() => void update({ language: option })}
            />
            {t(`settings.language${option === 'en' ? 'English' : 'Spanish'}`)}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>{t('settings.outputDirectory')}</legend>
        <input value={settings.outputDirectory} readOnly />
        <button onClick={() => void handleChooseFolder()}>{t('settings.chooseFolder')}</button>
      </fieldset>
    </div>
  )
}
