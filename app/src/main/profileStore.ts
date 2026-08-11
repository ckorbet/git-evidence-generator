import { mkdir, readdir, rm } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import type { Profile } from '@core/index'
import { DEFAULT_EXTENSION_WHITELIST, readJsonFile, writeJsonFileAtomic } from '@core/index'
import { profileFilePath, profilesDir } from './paths'

export class DuplicateProfileNameError extends Error {
  constructor(name: string) {
    super(`A profile named "${name}" already exists.`)
    this.name = 'DuplicateProfileNameError'
  }
}

export class ProfileNotFoundError extends Error {
  constructor(profileId: string) {
    super(`Profile "${profileId}" was not found.`)
    this.name = 'ProfileNotFoundError'
  }
}

/** Lists every persisted profile, sorted by name for stable UI ordering. */
export async function listProfiles(): Promise<Profile[]> {
  await mkdir(profilesDir(), { recursive: true })
  const files = await readdir(profilesDir())
  const profiles: Profile[] = []
  for (const file of files) {
    if (!file.endsWith('.json')) continue
    const profileId = file.slice(0, -'.json'.length)
    const profile = await readJsonFile<Profile | null>(profileFilePath(profileId), null)
    if (profile) profiles.push(profile)
  }
  return profiles.sort((a, b) => a.name.localeCompare(b.name))
}

/** Loads a single profile by id, or `null` if it does not exist. */
export async function getProfile(profileId: string): Promise<Profile | null> {
  return readJsonFile<Profile | null>(profileFilePath(profileId), null)
}

async function assertNameNotTaken(name: string, ignoreProfileId?: string): Promise<void> {
  const existing = await listProfiles()
  const clash = existing.find(
    (profile) => profile.id !== ignoreProfileId && profile.name.toLowerCase() === name.toLowerCase()
  )
  if (clash) throw new DuplicateProfileNameError(name)
}

/** Creates a new, empty profile with the given name and broadened default extension whitelist. */
export async function createProfile(name: string): Promise<Profile> {
  await assertNameNotTaken(name)
  const now = new Date().toISOString()
  const profile: Profile = {
    id: randomUUID(),
    name,
    repositories: [],
    people: [],
    blacklistWords: [],
    extensionWhitelist: [...DEFAULT_EXTENSION_WHITELIST],
    credential: { username: '', encryptedPat: '' },
    createdAt: now,
    updatedAt: now
  }
  await writeJsonFileAtomic(profileFilePath(profile.id), profile)
  return profile
}

/** Persists changes to an existing profile, rejecting a rename that collides with another profile. */
export async function updateProfile(profile: Profile): Promise<Profile> {
  const existing = await getProfile(profile.id)
  if (!existing) throw new ProfileNotFoundError(profile.id)
  await assertNameNotTaken(profile.name, profile.id)
  const updated: Profile = { ...profile, updatedAt: new Date().toISOString() }
  await writeJsonFileAtomic(profileFilePath(profile.id), updated)
  return updated
}

/** Deletes a profile's persisted JSON file. Does not remove its history (kept for audit purposes). */
export async function deleteProfile(profileId: string): Promise<void> {
  await rm(profileFilePath(profileId), { force: true })
}
