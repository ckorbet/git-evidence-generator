const REDACTION_MARKER = '**CENSORED**'

/**
 * Escapes a user-supplied blacklist word so it can be used as a literal (non-regex)
 * match inside a RegExp, while still allowing case-insensitive matching.
 */
function escapeForRegex(word: string): string {
  return word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Redacts every occurrence of every configured blacklist word within `text`,
 * case-insensitively, replacing only the matched word/token (not the whole line).
 * Blacklist words are treated as literal strings, not regular expressions.
 */
export function redactBlacklistWords(text: string, blacklistWords: string[]): string {
  if (blacklistWords.length === 0) return text

  let result = text
  for (const word of blacklistWords) {
    const trimmed = word.trim()
    if (trimmed.length === 0) continue
    const pattern = new RegExp(escapeForRegex(trimmed), 'gi')
    result = result.replace(pattern, REDACTION_MARKER)
  }
  return result
}
