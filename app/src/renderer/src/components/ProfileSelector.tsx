import { useTranslation } from 'react-i18next'
import { useAppState } from '../state/AppState'

export function ProfileSelector(): React.JSX.Element {
  const { t } = useTranslation()
  const { profiles, activeProfile, setActiveProfileId } = useAppState()

  if (profiles.length === 0) {
    return <p className="profile-selector-empty">{t('profileSelector.createFirst')}</p>
  }

  return (
    <div className="profile-selector">
      <label htmlFor="profile-selector-select">{t('profileSelector.label')}</label>
      <select
        id="profile-selector-select"
        value={activeProfile?.id ?? ''}
        onChange={(event) => void setActiveProfileId(event.target.value || null)}
      >
        <option value="" disabled>
          {t('profileSelector.none')}
        </option>
        {profiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.name}
          </option>
        ))}
      </select>
    </div>
  )
}
