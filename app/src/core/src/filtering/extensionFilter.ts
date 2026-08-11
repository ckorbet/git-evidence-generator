/**
 * Determines whether `filePath` matches the profile's file-extension whitelist.
 * An empty whitelist means "include all extensions".
 */
export function matchesExtensionWhitelist(filePath: string, whitelist: string[]): boolean {
  if (whitelist.length === 0) return true

  const lowerPath = filePath.toLowerCase()
  return whitelist.some((extension) => lowerPath.endsWith(extension.toLowerCase()))
}
