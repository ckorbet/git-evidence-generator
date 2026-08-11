import type { GitEvidenceApi } from '@core/renderer-safe'

declare global {
  interface Window {
    api: GitEvidenceApi
  }
}

export {}
