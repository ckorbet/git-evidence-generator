import { describe, expect, it, vi } from 'vitest'

vi.mock('electron', () => ({
  safeStorage: {
    isEncryptionAvailable: () => true,
    encryptString: (plaintext: string) => Buffer.from(`enc:${plaintext}`, 'utf-8'),
    decryptString: (buffer: Buffer) => buffer.toString('utf-8').replace(/^enc:/, '')
  }
}))

describe('credentialService', () => {
  it('round-trips a secret through encrypt/decrypt', async () => {
    const { encryptSecret, decryptSecret } = await import('./credentialService')
    const encrypted = encryptSecret('ghp_myPersonalAccessToken')
    expect(encrypted).not.toContain('ghp_myPersonalAccessToken')
    expect(decryptSecret(encrypted)).toBe('ghp_myPersonalAccessToken')
  })

  it('returns an empty string unchanged without invoking safeStorage', () => {
    return import('./credentialService').then(({ encryptSecret, decryptSecret }) => {
      expect(encryptSecret('')).toBe('')
      expect(decryptSecret('')).toBe('')
    })
  })
})
