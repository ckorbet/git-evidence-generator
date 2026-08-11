import { describe, expect, it } from 'vitest'
import { isBinaryContent } from './binaryDetector'

describe('isBinaryContent', () => {
  it('treats content with a NUL byte as binary', () => {
    expect(isBinaryContent('abc\u0000def')).toBe(true)
    expect(isBinaryContent(Buffer.from([0x61, 0x00, 0x62]))).toBe(true)
  })

  it('treats plain text content as non-binary', () => {
    expect(isBinaryContent('const x = 1;\nconsole.log(x);')).toBe(false)
    expect(isBinaryContent(Buffer.from('hello world', 'utf-8'))).toBe(false)
  })
})
