import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Profile } from '@core/renderer-safe'
import {
  parseRepositoryList,
  parseTrackedPeople,
  serializeRepositoryList,
  serializeTrackedPeople
} from '@core/renderer-safe'
import { useAppState } from '../state/AppState'

interface DraftState {
  name: string
  repositoriesText: string
  peopleText: string
  blacklistText: string
  extensionWhitelistText: string
  username: string
  pat: string
}

function toDraft(profile: Profile): DraftState {
  return {
    name: profile.name,
    repositoriesText: serializeRepositoryList(profile.repositories),
    peopleText: serializeTrackedPeople(profile.people),
    blacklistText: profile.blacklistWords.join('\n'),
    extensionWhitelistText: profile.extensionWhitelist.join('\n'),
    username: profile.credential.username,
    pat: ''
  }
}

/**
 * Edit form for a single profile. Keyed by `profile.id` from the parent so switching the
 * selected profile remounts this component with fresh initial state derived straight from
 * props - no effect-based state synchronization needed.
 */
function ProfileEditForm({
  profile,
  onSaved
}: {
  profile: Profile
  onSaved: () => Promise<void>
}): React.JSX.Element {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<DraftState>(() => toDraft(profile))
  const [error, setError] = useState<string | null>(null)

  async function handleSave(): Promise<void> {
    setError(null)
    try {
      await window.api.profiles.update({
        ...profile,
        name: draft.name,
        repositories: parseRepositoryList(draft.repositoriesText),
        people: parseTrackedPeople(draft.peopleText),
        blacklistWords: draft.blacklistText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0),
        extensionWhitelist: draft.extensionWhitelistText
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      })
      if (draft.pat) {
        await window.api.profiles.setCredential(profile.id, draft.username, draft.pat)
      } else if (draft.username !== profile.credential.username) {
        await window.api.profiles.setCredential(profile.id, draft.username, '')
      }
      await onSaved()
    } catch (saveError) {
      setError((saveError as Error).message)
    }
  }

  return (
    <div className="profile-edit-form">
      {error && <p className="error-message">{error}</p>}
      <label>
        {t('profiles.nameLabel')}
        <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
      </label>
      <label>
        {t('profiles.repositoriesLabel')}
        <textarea
          rows={4}
          value={draft.repositoriesText}
          onChange={(e) => setDraft({ ...draft, repositoriesText: e.target.value })}
        />
      </label>
      <label>
        {t('profiles.peopleLabel')}
        <textarea
          rows={4}
          value={draft.peopleText}
          onChange={(e) => setDraft({ ...draft, peopleText: e.target.value })}
        />
      </label>
      <label>
        {t('profiles.blacklistLabel')}
        <textarea
          rows={3}
          value={draft.blacklistText}
          onChange={(e) => setDraft({ ...draft, blacklistText: e.target.value })}
        />
      </label>
      <label>
        {t('profiles.extensionWhitelistLabel')}
        <textarea
          rows={4}
          value={draft.extensionWhitelistText}
          onChange={(e) => setDraft({ ...draft, extensionWhitelistText: e.target.value })}
        />
      </label>
      <label>
        {t('profiles.usernameLabel')}
        <input value={draft.username} onChange={(e) => setDraft({ ...draft, username: e.target.value })} />
      </label>
      <label>
        {t('profiles.patLabel')}
        <input type="password" value={draft.pat} onChange={(e) => setDraft({ ...draft, pat: e.target.value })} />
      </label>
      <button onClick={() => void handleSave()}>{t('profiles.save')}</button>
    </div>
  )
}

export function ProfilesScreen(): React.JSX.Element {
  const { t } = useTranslation()
  const { profiles, refreshProfiles } = useAppState()
  const [selectedId, setSelectedId] = useState<string | null>(profiles[0]?.id ?? null)
  const [creationError, setCreationError] = useState<string | null>(null)

  const selectedProfile = profiles.find((profile) => profile.id === selectedId) ?? null

  async function handleCreate(): Promise<void> {
    setCreationError(null)
    try {
      const name = t('profiles.nameLabel') + ' ' + (profiles.length + 1)
      const created = await window.api.profiles.create(name)
      await refreshProfiles()
      setSelectedId(created.id)
    } catch (error) {
      setCreationError((error as Error).message)
    }
  }

  async function handleDelete(profileId: string): Promise<void> {
    if (!window.confirm(t('profiles.confirmDelete'))) return
    await window.api.profiles.delete(profileId)
    await refreshProfiles()
    if (selectedId === profileId) setSelectedId(null)
  }

  return (
    <div className="profiles-screen">
      <h2>{t('profiles.title')}</h2>
      <div className="profiles-layout">
        <div className="profiles-list">
          <button onClick={() => void handleCreate()}>{t('profiles.create')}</button>
          {creationError && <p className="error-message">{creationError}</p>}
          {profiles.length === 0 && <p className="empty-state">{t('profiles.emptyState')}</p>}
          <ul>
            {profiles.map((profile) => (
              <li key={profile.id}>
                <button
                  className={profile.id === selectedId ? 'profile-list-item active' : 'profile-list-item'}
                  onClick={() => setSelectedId(profile.id)}
                >
                  {profile.name}
                </button>
                <button className="delete-button" onClick={() => void handleDelete(profile.id)}>
                  {t('profiles.delete')}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {selectedProfile && (
          <ProfileEditForm key={selectedProfile.id} profile={selectedProfile} onSaved={refreshProfiles} />
        )}
      </div>
    </div>
  )
}
