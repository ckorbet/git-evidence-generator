import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let testUserDataDir: string

vi.mock('electron', () => ({
  app: {
    getPath: () => testUserDataDir
  }
}))

describe('profileStore', () => {
  beforeEach(async () => {
    testUserDataDir = await mkdtemp(join(tmpdir(), 'gitevidence-profiles-'))
  })

  afterEach(async () => {
    await rm(testUserDataDir, { recursive: true, force: true })
  })

  it('creates a profile with the broadened default extension whitelist', async () => {
    const { createProfile } = await import('./profileStore')
    const profile = await createProfile('Team Alpha')
    expect(profile.name).toBe('Team Alpha')
    expect(profile.extensionWhitelist.length).toBeGreaterThan(0)
    expect(profile.repositories).toEqual([])
  })

  it('lists profiles sorted by name', async () => {
    const { createProfile, listProfiles } = await import('./profileStore')
    await createProfile('Zebra')
    await createProfile('Alpha')
    const profiles = await listProfiles()
    expect(profiles.map((p) => p.name)).toEqual(['Alpha', 'Zebra'])
  })

  it('rejects creating a profile with a duplicate name (case-insensitive)', async () => {
    const { createProfile, DuplicateProfileNameError } = await import('./profileStore')
    await createProfile('Team Alpha')
    await expect(createProfile('team alpha')).rejects.toThrow(DuplicateProfileNameError)
  })

  it('updates a profile and rejects a rename colliding with another profile', async () => {
    const { createProfile, updateProfile, DuplicateProfileNameError } = await import('./profileStore')
    const first = await createProfile('First')
    const second = await createProfile('Second')
    await expect(updateProfile({ ...second, name: 'First' })).rejects.toThrow(
      DuplicateProfileNameError
    )
    const renamed = await updateProfile({ ...first, name: 'First Renamed' })
    expect(renamed.name).toBe('First Renamed')
  })

  it('deletes a profile', async () => {
    const { createProfile, deleteProfile, getProfile } = await import('./profileStore')
    const profile = await createProfile('To Delete')
    await deleteProfile(profile.id)
    expect(await getProfile(profile.id)).toBeNull()
  })
})
