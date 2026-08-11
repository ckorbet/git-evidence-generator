import { describe, expect, it } from 'vitest'
import { en, es } from './resources'

/** Recursively collects dotted key paths from a nested object of string leaves. */
function collectKeyPaths(obj: object, prefix = ''): string[] {
  const paths: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object' && value !== null) {
      paths.push(...collectKeyPaths(value, path))
    } else {
      paths.push(path)
    }
  }
  return paths
}

describe('i18n resource completeness', () => {
  it('has an identical set of keys in the es bundle as the en bundle', () => {
    const enKeys = collectKeyPaths(en).sort()
    const esKeys = collectKeyPaths(es).sort()
    expect(esKeys).toEqual(enKeys)
  })

  it('has no empty string values in either bundle', () => {
    for (const bundle of [en, es]) {
      const keys = collectKeyPaths(bundle)
      for (const key of keys) {
        const value = key.split('.').reduce<unknown>((acc, part) => (acc as never)[part], bundle)
        expect(typeof value === 'string' && value.length > 0).toBe(true)
      }
    }
  })
})
