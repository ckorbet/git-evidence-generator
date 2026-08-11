import { contextBridge, ipcRenderer } from 'electron'
import { IPC_CHANNELS } from '@core/index'
import type { GitEvidenceApi, ScanProgressEvent } from '@core/index'

const api: GitEvidenceApi = {
  settings: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.settingsGet),
    update: (patch) => ipcRenderer.invoke(IPC_CHANNELS.settingsUpdate, patch),
    chooseOutputDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.settingsChooseOutputDirectory)
  },
  profiles: {
    list: () => ipcRenderer.invoke(IPC_CHANNELS.profilesList),
    get: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.profilesGet, profileId),
    create: (name) => ipcRenderer.invoke(IPC_CHANNELS.profilesCreate, name),
    update: (profile) => ipcRenderer.invoke(IPC_CHANNELS.profilesUpdate, profile),
    delete: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.profilesDelete, profileId),
    setCredential: (profileId, username, pat) =>
      ipcRenderer.invoke(IPC_CHANNELS.profilesSetCredential, profileId, username, pat)
  },
  history: {
    list: (profileId) => ipcRenderer.invoke(IPC_CHANNELS.historyList, profileId),
    checkFileExists: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.historyCheckFileExists, filePath)
  },
  report: {
    generate: (params) => ipcRenderer.invoke(IPC_CHANNELS.reportGenerate, params),
    regenerate: (params) => ipcRenderer.invoke(IPC_CHANNELS.reportRegenerate, params),
    onProgress: (callback) => {
      const listener = (_event: unknown, payload: ScanProgressEvent): void => callback(payload)
      ipcRenderer.on(IPC_CHANNELS.reportProgress, listener)
      return () => ipcRenderer.removeListener(IPC_CHANNELS.reportProgress, listener)
    },
    openFile: (filePath) => ipcRenderer.invoke(IPC_CHANNELS.reportOpenFile, filePath)
  }
}

contextBridge.exposeInMainWorld('api', api)
