/**
 * Site URL utilities
 */

/**
 * Gets the current site URL for client-side usage.
 * Uses environment-specific configuration.
 */
export function getSiteUrl(): string {
  if (typeof window !== 'undefined') {
    // Client-side - use current origin
    return window.location.origin
  }

  // Server-side fallback (shouldn't happen in client components)
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
