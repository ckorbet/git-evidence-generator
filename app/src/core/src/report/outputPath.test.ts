import { describe, expect, it } from 'vitest'
import { sanitizeForFilename, buildReportOutputPath } from './outputPath'

describe('sanitizeForFilename', () => {
  it('replaces characters invalid on Windows/macOS filesystems', () => {
    expect(sanitizeForFilename('Devon: Lane / QA?')).toBe('Devon_ Lane _ QA_')
  })

  it('leaves already-safe strings unchanged', () => {
    expect(sanitizeForFilename('Devon_Lane-2024')).toBe('Devon_Lane-2024')
  })

  it('trims surrounding whitespace', () => {
    expect(sanitizeForFilename('  Devon Lane  ')).toBe('Devon Lane')
  })
})

describe('buildReportOutputPath', () => {
  it('builds a deterministic path nesting the profile folder and file name', () => {
    const result = buildReportOutputPath({
      outputDirectory: 'C:\\Users\\me\\Reports',
      profileName: 'Team Alpha',
      personDisplayName: 'Devon Lane',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31'
    })
    expect(result).toBe(
      'C:\\Users\\me\\Reports\\Team Alpha\\Team Alpha_Devon Lane_2024-01-01-2024-01-31.pdf'
    )
  })

  it('sanitizes profile and person names used in the path', () => {
    const result = buildReportOutputPath({
      outputDirectory: 'C:\\Reports',
      profileName: 'Team: Alpha',
      personDisplayName: 'Devon/Lane',
      dateFrom: '2024-01-01',
      dateTo: '2024-01-31'
    })
    expect(result).toBe('C:\\Reports\\Team_ Alpha\\Team_ Alpha_Devon_Lane_2024-01-01-2024-01-31.pdf')
  })
})
