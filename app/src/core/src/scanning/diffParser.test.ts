import { describe, expect, it } from 'vitest'
import { parseCommitDiffOutput } from './diffParser'

const SAMPLE_DIFF = `diff --git a/src/app.ts b/src/app.ts
index e69de29..b6fc4c6 100644
--- a/src/app.ts
+++ b/src/app.ts
@@ -1,3 +1,4 @@
 line one
-line two
+line two changed
+line three added
 line four
diff --git a/assets/logo.png b/assets/logo.png
index 1234567..89abcde 100644
Binary files a/assets/logo.png and b/assets/logo.png differ
diff --git a/src/deleted.ts b/src/deleted.ts
deleted file mode 100644
index abc1234..0000000
--- a/src/deleted.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-line one
-line two
`

describe('parseCommitDiffOutput', () => {
  it('parses added, removed, context, and header lines for a text file', () => {
    const result = parseCommitDiffOutput(SAMPLE_DIFF)
    const appFile = result.fileDiffs.find((file) => file.path === 'src/app.ts')
    expect(appFile).toBeDefined()
    expect(appFile!.lines).toEqual([
      { kind: 'header', text: '@@ -1,3 +1,4 @@' },
      { kind: 'context', text: 'line one' },
      { kind: 'remove', text: 'line two' },
      { kind: 'add', text: 'line two changed' },
      { kind: 'add', text: 'line three added' },
      { kind: 'context', text: 'line four' }
    ])
  })

  it('excludes binary files from fileDiffs and records their path separately', () => {
    const result = parseCommitDiffOutput(SAMPLE_DIFF)
    expect(result.binaryPaths).toEqual(['assets/logo.png'])
    expect(result.fileDiffs.find((file) => file.path === 'assets/logo.png')).toBeUndefined()
  })

  it('counts added and removed lines across all files', () => {
    const result = parseCommitDiffOutput(SAMPLE_DIFF)
    // app.ts: +2/-1, deleted.ts: +0/-2
    expect(result.linesAdded).toBe(2)
    expect(result.linesRemoved).toBe(3)
  })

  it('resolves the old path for a deleted file', () => {
    const result = parseCommitDiffOutput(SAMPLE_DIFF)
    expect(result.fileDiffs.some((file) => file.path === 'src/deleted.ts')).toBe(true)
  })
})
