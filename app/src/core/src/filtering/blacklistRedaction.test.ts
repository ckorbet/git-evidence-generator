import { describe, expect, it } from 'vitest'
import { redactBlacklistWords } from './blacklistRedaction'

describe('redactBlacklistWords', () => {
  it('redacts a matched word case-insensitively, leaving the rest of the line intact', () => {
    const result = redactBlacklistWords('const PASSWORD_SECRET = "abc123";', ['password_secret'])
    expect(result).toBe('const **CENSORED** = "abc123";')
  })

  it('redacts multiple different blacklist words within the same text', () => {
    const result = redactBlacklistWords('api_key_production and credentials_debug found', [
      'api_key_production',
      'credentials_debug'
    ])
    expect(result).toBe('**CENSORED** and **CENSORED** found')
  })

  it('redacts every occurrence of a repeated word', () => {
    const result = redactBlacklistWords('secretValue = secretValue + 1', ['secretValue'])
    expect(result).toBe('**CENSORED** = **CENSORED** + 1')
  })

  it('returns the text unmodified when the blacklist is empty', () => {
    const text = 'nothing to redact here'
    expect(redactBlacklistWords(text, [])).toBe(text)
  })

  it('treats blacklist words as literal strings, not regular expressions', () => {
    const result = redactBlacklistWords('price is $5.00 (special)', ['$5.00'])
    expect(result).toBe('price is **CENSORED** (special)')
  })

  it('ignores blank blacklist entries', () => {
    const result = redactBlacklistWords('some text', ['', '   '])
    expect(result).toBe('some text')
  })
})
