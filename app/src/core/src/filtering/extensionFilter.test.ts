import { describe, expect, it } from 'vitest'
import { matchesExtensionWhitelist } from './extensionFilter'

describe('matchesExtensionWhitelist', () => {
  it('includes all files when the whitelist is empty', () => {
    expect(matchesExtensionWhitelist('src/index.ts', [])).toBe(true)
    expect(matchesExtensionWhitelist('image.png', [])).toBe(true)
  })

  it('matches a file whose extension is in the whitelist', () => {
    expect(matchesExtensionWhitelist('src/index.ts', ['.ts', '.js'])).toBe(true)
  })

  it('excludes a file whose extension is not in the whitelist', () => {
    expect(matchesExtensionWhitelist('image.png', ['.ts', '.js'])).toBe(false)
  })

  it('matches case-insensitively', () => {
    expect(matchesExtensionWhitelist('README.TXT', ['.txt'])).toBe(true)
  })
})
