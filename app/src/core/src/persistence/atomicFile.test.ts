import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

let testDir: string

describe('atomicFile', () => {
  beforeEach(async () => {
    testDir = await mkdtemp(join(tmpdir(), 'gitevidence-atomicfile-'))
    vi.resetModules()
  })

  afterEach(async () => {
    vi.doUnmock('node:fs/promises')
    await rm(testDir, { recursive: true, force: true })
  })

  it('round-trips a value written atomically', async () => {
    const { writeJsonFileAtomic, readJsonFile } = await import('./atomicFile')
    const filePath = join(testDir, 'value.json')
    await writeJsonFileAtomic(filePath, { hello: 'world' })
    const loaded = await readJsonFile(filePath, null)
    expect(loaded).toEqual({ hello: 'world' })
  })

  it('leaves the original file untouched and removes the temp file when the rename step fails', async () => {
    const filePath = join(testDir, 'profile.json')
    await writeFile(filePath, JSON.stringify({ version: 1 }), 'utf-8')

    // Simulate an interruption during the atomic rename (e.g. a crash or disk failure between
    // the temp-file write and the rename into place) by making `rename` reject.
    vi.doMock('node:fs/promises', async () => {
      const actual = await vi.importActual<typeof import('node:fs/promises')>('node:fs/promises')
      return {
        ...actual,
        rename: vi.fn(async () => {
          throw new Error('simulated crash during rename')
        })
      }
    })

    const { writeJsonFileAtomic } = await import('./atomicFile')
    await expect(writeJsonFileAtomic(filePath, { version: 2 })).rejects.toThrow(
      'simulated crash during rename'
    )

    // The original file must still contain the old, valid contents - never a partial write.
    const contents = await readFile(filePath, 'utf-8')
    expect(JSON.parse(contents)).toEqual({ version: 1 })

    // No leftover `.tmp` file should remain in the directory.
    const { readdir } = await vi.importActual<typeof import('node:fs/promises')>(
      'node:fs/promises'
    )
    const entries = await readdir(testDir)
    expect(entries.some((name) => name.endsWith('.tmp'))).toBe(false)
  })
})
