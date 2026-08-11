import type { AppSettings } from '@core/index'
import { readJsonFile, writeJsonFileAtomic } from '@core/index'
import { settingsFilePath } from './paths'

/** Default settings applied on first run, before any `settings.json` file exists. */
export function defaultSettings(): AppSettings {
  return {
    appearance: 'system',
    language: 'en',
    outputDirectory: '',
    activeProfileId: null
  }
}

/** Loads `settings.json`, falling back to defaults if it does not exist yet. */
export async function loadSettings(): Promise<AppSettings> {
  const fallback = defaultSettings()
  const loaded = await readJsonFile<AppSettings>(settingsFilePath(), fallback)
  // Merge over defaults so a settings file from an older version missing new keys
  // still yields a fully-populated, valid settings object.
  return { ...fallback, ...loaded }
}

/** Persists `settings.json` atomically. */
export async function saveSettings(settings: AppSettings): Promise<void> {
  await writeJsonFileAtomic(settingsFilePath(), settings)
}
