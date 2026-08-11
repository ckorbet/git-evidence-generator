import { describe, expect, it } from 'vitest'
import { parseTrackedPeople, serializeTrackedPeople } from './parsePeople'

describe('parseTrackedPeople', () => {
  it('parses a person with multiple aliases', () => {
    const result = parseTrackedPeople('Devon Lane: devon.lane@enterprise.com, dl-dev')
    expect(result).toEqual([
      { displayName: 'Devon Lane', aliases: ['devon.lane@enterprise.com', 'dl-dev'] }
    ])
  })

  it('parses a person with a single alias', () => {
    const result = parseTrackedPeople('Sarah Connor: sarah.connor@enterprise.com')
    expect(result).toEqual([
      { displayName: 'Sarah Connor', aliases: ['sarah.connor@enterprise.com'] }
    ])
  })

  it('parses multiple people, one per line, ignoring blank lines', () => {
    const result = parseTrackedPeople(
      'Devon Lane: devon.lane@enterprise.com, dl-dev\n\nSarah Connor: sarah.connor@enterprise.com\n'
    )
    expect(result).toHaveLength(2)
    expect(result[0].displayName).toBe('Devon Lane')
    expect(result[1].displayName).toBe('Sarah Connor')
  })

  it('treats a line without a colon as a name with no aliases', () => {
    const result = parseTrackedPeople('Just A Name')
    expect(result).toEqual([{ displayName: 'Just A Name', aliases: [] }])
  })

  it('returns an empty array for empty input', () => {
    expect(parseTrackedPeople('')).toEqual([])
    expect(parseTrackedPeople('   \n  \n')).toEqual([])
  })

  it('round-trips through serializeTrackedPeople', () => {
    const input = 'Devon Lane: devon.lane@enterprise.com, dl-dev\nSarah Connor: sarah.connor@enterprise.com'
    const parsed = parseTrackedPeople(input)
    expect(serializeTrackedPeople(parsed)).toBe(input)
  })
})
