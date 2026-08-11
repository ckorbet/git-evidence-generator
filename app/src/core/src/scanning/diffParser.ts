import type { DiffLine, FileDiff } from '../types'

interface ParsedCommitDiff {
  fileDiffs: FileDiff[]
  binaryPaths: string[]
  linesAdded: number
  linesRemoved: number
}

/**
 * Parses the raw output of `git diff-tree --root -p --no-color -r <hash>` into a list of
 * per-file diffs, classifying each line as an addition, removal, context, or hunk header,
 * and separately collecting paths of files git reports as binary (which have no textual
 * diff to render).
 */
export function parseCommitDiffOutput(rawOutput: string): ParsedCommitDiff {
  const lines = rawOutput.split(/\r?\n/)

  const fileDiffs: FileDiff[] = []
  const binaryPaths: string[] = []
  let currentFile: FileDiff | null = null
  let linesAdded = 0
  let linesRemoved = 0

  for (const line of lines) {
    if (line.startsWith('diff --git ')) {
      currentFile = { path: extractPathFromDiffHeader(line), lines: [] }
      fileDiffs.push(currentFile)
      continue
    }

    if (!currentFile) continue

    if (line.startsWith('Binary files ') && line.endsWith(' differ')) {
      binaryPaths.push(currentFile.path)
      continue
    }

    if (isMetadataLine(line)) {
      continue
    }

    if (line.startsWith('@@')) {
      currentFile.lines.push({ kind: 'header', text: line })
      continue
    }

    if (line.startsWith('+')) {
      currentFile.lines.push({ kind: 'add', text: line.slice(1) })
      linesAdded += 1
      continue
    }

    if (line.startsWith('-')) {
      currentFile.lines.push({ kind: 'remove', text: line.slice(1) })
      linesRemoved += 1
      continue
    }

    if (line.startsWith(' ')) {
      currentFile.lines.push({ kind: 'context', text: line.slice(1) })
      continue
    }
  }

  const nonBinaryFileDiffs = fileDiffs.filter((file) => !binaryPaths.includes(file.path))

  return { fileDiffs: nonBinaryFileDiffs, binaryPaths, linesAdded, linesRemoved }
}

function isMetadataLine(line: string): boolean {
  return (
    line.startsWith('index ') ||
    line.startsWith('--- ') ||
    line.startsWith('+++ ') ||
    line.startsWith('new file mode') ||
    line.startsWith('deleted file mode') ||
    line.startsWith('old mode') ||
    line.startsWith('new mode') ||
    line.startsWith('similarity index') ||
    line.startsWith('rename from') ||
    line.startsWith('rename to') ||
    line.startsWith('copy from') ||
    line.startsWith('copy to')
  )
}

/** Extracts the file path from a `diff --git a/<path> b/<path>` header line, preferring the "b/" (new) side. */
function extractPathFromDiffHeader(line: string): string {
  const match = line.match(/^diff --git a\/(.+) b\/(.+)$/)
  if (!match) return line.replace('diff --git ', '')
  const [, oldPath, newPath] = match
  return newPath === '/dev/null' ? oldPath : newPath
}

export type { DiffLine, FileDiff }
