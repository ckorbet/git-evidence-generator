import { app } from 'electron'
import { join } from 'node:path'

/** Absolute path to the app's per-user data directory (OS-specific, provided by Electron). */
export function userDataDir(): string {
  return app.getPath('userData')
}

export function settingsFilePath(): string {
  return join(userDataDir(), 'settings.json')
}

export function profileFilePath(profileId: string): string {
  return join(userDataDir(), 'profiles', `${profileId}.json`)
}

export function profilesDir(): string {
  return join(userDataDir(), 'profiles')
}

export function historyFilePath(profileId: string): string {
  return join(userDataDir(), 'history', `${profileId}.json`)
}
