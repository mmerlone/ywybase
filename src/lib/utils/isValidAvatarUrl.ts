/**
 * Checks if a given avatar URL is safe for use (prevents SSRF).
 * - Must be HTTPS
 * - Must not be localhost or private/internal IP
 * - Optionally, can restrict to known CDN hostnames
 *
 * @param urlString The avatar URL to validate
 * @param allowedHosts Optional array of allowed hostnames (CDNs)
 * @returns The sanitized URL string if valid, otherwise null
 */
export function isValidAvatarUrl(urlString: string | null | undefined, allowedHosts?: string[]): string | null {
  if (!urlString) return null
  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return null
  }
  if (url.protocol !== 'https:') return null

  // Block localhost and loopback
  const hostname = url.hostname.toLowerCase()
  if (['localhost', '::1', '0.0.0.0'].includes(hostname)) return null
  // Block private IPs (IPv4)
  const privateIPv4 = [/^10\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./, /^192\.168\./, /^169\.254\./]
  if (privateIPv4.some((re) => re.test(url.hostname))) return null
  // Block private IPs (IPv4)
  // Block private IPv6
  const lowerHostname = url.hostname.toLowerCase()
  if (
    lowerHostname.startsWith('fd') ||
    lowerHostname.startsWith('fc') ||
    lowerHostname.startsWith('fe80') ||
    lowerHostname.startsWith('::ffff:')
  )
    return null

  // Block private IPv6
  if (url.hostname.startsWith('fd') || url.hostname.startsWith('fc')) return null

  // Optionally, enforce allowlist
  if (allowedHosts && allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) return null

  return url.toString()
}
