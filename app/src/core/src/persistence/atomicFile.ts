import { mkdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { randomUUID } from 'node:crypto'

/**
 * Ensures the parent directory of `filePath` exists.
 */
async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true })
}

/**
 * Writes `data` as JSON to `filePath` atomically: the content is first written to a
 * temporary sibling file, then renamed into place. This guarantees a reader never
 * observes a partially-written file, and an interruption (crash/power loss) leaves
 * either the old file intact or the new file fully written - never a corrupt mix.
 */
export async function writeJsonFileAtomic(filePath: string, data: unknown): Promise<void> {
  await ensureParentDir(filePath)
  const tempPath = join(dirname(filePath), `.${randomUUID()}.tmp`)
  const contents = JSON.stringify(data, null, 2)
  await writeFile(tempPath, contents, 'utf-8')
  try {
    await rename(tempPath, filePath)
  } catch (error) {
    await unlink(tempPath).catch(() => undefined)
    throw error
  }
}

/**
 * Reads and parses a JSON file. Returns `fallback` if the file does not exist.
 */
export async function readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const contents = await readFile(filePath, 'utf-8')
    return JSON.parse(contents) as T
  } catch (error) {
    if (isNotFoundError(error)) {
      return fallback
    }
    throw error
  }
}

function isNotFoundError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ENOENT'
  )
}
