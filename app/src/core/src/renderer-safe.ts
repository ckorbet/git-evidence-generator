/**
 * Renderer-safe subset of the `core` package barrel: pure types and string-parsing utilities
 * with no Node.js (`fs`, `path`, `child_process`) dependency, so this can be type-checked and
 * bundled for the Electron renderer process without pulling in main-process-only modules
 * (persistence, repository scanning, output paths) that assume a Node runtime.
 */
export * from './types'
export * from './defaults'
export * from './identity/parsePeople'
export * from './identity/matchAuthor'
export * from './filtering/extensionFilter'
export * from './filtering/blacklistRedaction'
export * from './scanning/parseRepoList'
export * from './scanning/diffParser'
export * from './scanning/logParser'
export * from './report/reportDataAssembler'
export * from './report/reportTemplate'
export * from './i18n/resources'
export * from './i18n/reportLabels'
export * from './ipcContract'
