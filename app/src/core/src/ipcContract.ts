import type {
  AppSettings,
  DateRange,
  HistoryEntry,
  Profile,
  ScanProgressEvent
} from './types'

/** Result of a single report-generation run, returned to the renderer for the summary UI. */
export interface GenerateReportResult {
  generatedFiles: Array<{ personDisplayName: string; filePath: string }>
  skippedBinaryFileCount: number
  failedRepositories: Array<{ repositoryUrl: string; message: string }>
  historyEntryId: string
}

/** Parameters for a fresh (non-regeneration) report-generation run. */
export interface GenerateReportParams {
  profileId: string
  dateRange: DateRange
}

/** Parameters for a snapshot-based regeneration of a past history entry. */
export interface RegenerateReportParams {
  profileId: string
  historyEntryId: string
}

/**
 * The full typed contract exposed by the preload bridge on `window.api`. `main` implements
 * each of these as an `ipcMain.handle` (or `ipcMain.on` for progress) counterpart; `preload`
 * forwards calls 1:1 via `ipcRenderer.invoke`/`ipcRenderer.on`, and the renderer only ever
 * talks to `window.api` - never to `ipcRenderer` directly.
 */
export interface GitEvidenceApi {
  settings: {
    get(): Promise<AppSettings>
    update(patch: Partial<AppSettings>): Promise<AppSettings>
    chooseOutputDirectory(): Promise<string | null>
  }
  profiles: {
    list(): Promise<Profile[]>
    get(profileId: string): Promise<Profile | null>
    create(name: string): Promise<Profile>
    update(profile: Profile): Promise<Profile>
    delete(profileId: string): Promise<void>
    /** Sets an unencrypted PAT for a profile; main encrypts it before persisting. */
    setCredential(profileId: string, username: string, pat: string): Promise<Profile>
  }
  history: {
    list(profileId: string): Promise<HistoryEntry[]>
    checkFileExists(filePath: string): Promise<boolean>
  }
  report: {
    generate(params: GenerateReportParams): Promise<GenerateReportResult>
    regenerate(params: RegenerateReportParams): Promise<GenerateReportResult>
    onProgress(callback: (event: ScanProgressEvent) => void): () => void
    openFile(filePath: string): Promise<void>
  }
}

/** IPC channel name constants, shared verbatim between `main` and `preload`. */
export const IPC_CHANNELS = {
  settingsGet: 'settings:get',
  settingsUpdate: 'settings:update',
  settingsChooseOutputDirectory: 'settings:chooseOutputDirectory',
  profilesList: 'profiles:list',
  profilesGet: 'profiles:get',
  profilesCreate: 'profiles:create',
  profilesUpdate: 'profiles:update',
  profilesDelete: 'profiles:delete',
  profilesSetCredential: 'profiles:setCredential',
  historyList: 'history:list',
  historyCheckFileExists: 'history:checkFileExists',
  reportGenerate: 'report:generate',
  reportRegenerate: 'report:regenerate',
  reportProgress: 'report:progress',
  reportOpenFile: 'report:openFile'
} as const
