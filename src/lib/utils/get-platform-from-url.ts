import { SOCIAL_PLATFORMS, type SocialPlatformConfig } from '@/config/social'

/**
 * Gets the full platform config for a URL based on hostname matching.
 * Returns null if no specific platform matches (generic websites).
 *
 * @param url - The URL to check
 * @returns The platform config object, or null if no match
 */
export function getPlatformConfigForUrl(url: string): SocialPlatformConfig | null {
  try {
    const u = new URL(url)
    for (const platform of SOCIAL_PLATFORMS) {
      if (platform.key === 'website') continue
      if (platform.hostnames.some((h) => h !== null && u.hostname.endsWith(h))) {
        return platform
      }
    }
    return null
  } catch {
    return null
  }
}
