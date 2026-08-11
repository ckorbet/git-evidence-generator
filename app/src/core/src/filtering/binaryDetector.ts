/**
 * Detects whether file content should be treated as binary. Mirrors git's own heuristic:
 * content containing a NUL byte within the first chunk is considered binary.
 */
export function isBinaryContent(content: Buffer | string): boolean {
  if (typeof content === 'string') {
    return content.includes('\u0000')
  }
  const sampleSize = Math.min(content.length, 8000)
  for (let i = 0; i < sampleSize; i += 1) {
    if (content[i] === 0) return true
  }
  return false
}
