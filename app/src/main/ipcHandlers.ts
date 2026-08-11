import { dialog, ipcMain, shell, type BrowserWindow } from 'electron'
import type { GenerateReportResult, Profile } from '@core/index'
import { IPC_CHANNELS } from '@core/index'
import { encryptSecret } from './credentialService'
import {
  DuplicateProfileNameError,
  ProfileNotFoundError,
  createProfile,
  deleteProfile,
  getProfile,
  listProfiles,
  updateProfile
} from './profileStore'
import { fileExists, listHistory } from './historyStore'
import { loadSettings, saveSettings } from './settingsStore'
import { generateReport, regenerateReport } from './reportGenerator'

async function requireProfile(profileId: string): Promise<Profile> {
  const profile = await getProfile(profileId)
  if (!profile) throw new ProfileNotFoundError(profileId)
  return profile
}

/** Registers every IPC handler backing the typed `window.api` surface exposed to the renderer. */
export function registerIpcHandlers(mainWindow: BrowserWindow): void {
  ipcMain.handle(IPC_CHANNELS.settingsGet, () => loadSettings())

  ipcMain.handle(IPC_CHANNELS.settingsUpdate, async (_event, patch: Parameters<typeof saveSettings>[0]) => {
    const current = await loadSettings()
    const merged = { ...current, ...patch }
    await saveSettings(merged)
    return merged
  })

  ipcMain.handle(IPC_CHANNELS.settingsChooseOutputDirectory, async () => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  ipcMain.handle(IPC_CHANNELS.profilesList, () => listProfiles())
  ipcMain.handle(IPC_CHANNELS.profilesGet, (_event, profileId: string) => getProfile(profileId))
  ipcMain.handle(IPC_CHANNELS.profilesCreate, (_event, name: string) => createProfile(name))
  ipcMain.handle(IPC_CHANNELS.profilesUpdate, (_event, profile: Profile) => updateProfile(profile))
  ipcMain.handle(IPC_CHANNELS.profilesDelete, (_event, profileId: string) => deleteProfile(profileId))

  ipcMain.handle(
    IPC_CHANNELS.profilesSetCredential,
    async (_event, profileId: string, username: string, pat: string) => {
      const profile = await requireProfile(profileId)
      const updated: Profile = {
        ...profile,
        credential: { username, encryptedPat: pat ? encryptSecret(pat) : profile.credential.encryptedPat }
      }
      return updateProfile(updated)
    }
  )

  ipcMain.handle(IPC_CHANNELS.historyList, (_event, profileId: string) => listHistory(profileId))
  ipcMain.handle(IPC_CHANNELS.historyCheckFileExists, (_event, filePath: string) => fileExists(filePath))

  ipcMain.handle(
    IPC_CHANNELS.reportGenerate,
    async (_event, params: { profileId: string; dateRange: { from: string; to: string } }): Promise<GenerateReportResult> => {
      const profile = await requireProfile(params.profileId)
      return generateReport(profile, params.dateRange)
    }
  )

  ipcMain.handle(
    IPC_CHANNELS.reportRegenerate,
    async (_event, params: { profileId: string; historyEntryId: string }): Promise<GenerateReportResult> => {
      const profile = await requireProfile(params.profileId)
      return regenerateReport(profile, params.historyEntryId)
    }
  )

  ipcMain.handle(IPC_CHANNELS.reportOpenFile, async (_event, filePath: string) => {
    await shell.openPath(filePath)
  })
}

export { DuplicateProfileNameError, ProfileNotFoundError }
