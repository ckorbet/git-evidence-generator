import { safeStorage } from 'electron'

/**
 * Encrypts a plaintext secret (e.g. a Personal Access Token) using Electron's OS-level
 * `safeStorage` (DPAPI on Windows, Keychain on macOS) and returns a base64 string safe to
 * persist inside a profile's JSON file. Returns an empty string for an empty input so
 * "no credential configured yet" round-trips cleanly.
 */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return ''
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level credential encryption is not available on this machine.')
  }
  return safeStorage.encryptString(plaintext).toString('base64')
}

/**
 * Decrypts a base64-encoded, `safeStorage`-encrypted secret produced by {@link encryptSecret}.
 * The returned plaintext must never be sent across the IPC boundary to the renderer or logged.
 */
export function decryptSecret(encryptedBase64: string): string {
  if (!encryptedBase64) return ''
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('OS-level credential encryption is not available on this machine.')
  }
  return safeStorage.decryptString(Buffer.from(encryptedBase64, 'base64'))
}
