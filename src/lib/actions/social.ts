/**
 * @fileoverview Social link Server Actions.
 *
 * Provides server-side operations for social link metadata fetching.
 * Prefer these actions over the `/api/social-metadata` endpoint when calling
 * from client components within the application — they are invoked directly
 * without an extra HTTP round-trip and are fully type-safe.
 *
 * @module lib/actions/social
 */

'use server'

import { createServerActionSuccess, withServerActionErrorHandling } from '@/lib/error/server'
import { buildLogger } from '@/lib/logger/server'
import { createClient } from '@/lib/supabase/server'
import { getPlatformConfigForUrl } from '@/lib/utils/get-platform-from-url'
import { getOgMetadata, type OgMeta } from '@/lib/utils/social-metadata'
import { isValidSocialUrl } from '@/lib/utils/profile-utils'
import type { AuthResponse } from '@/types/error.types'

const logger = buildLogger('social-actions')

/**
 * Fetches Open Graph metadata for a social profile URL.
 *
 * Validates the URL, requires an authenticated session, then delegates to the
 * shared {@link getOgMetadata} utility (which includes an in-memory LRU cache).
 *
 * Use this instead of `fetch('/api/social-metadata?url=...')` inside client
 * components — it runs entirely on the server with no extra HTTP hop.
 *
 * @param url - An HTTPS social profile URL to fetch metadata for
 * @returns `{ success: true, data: OgMeta }` or `{ success: false, error }`.
 *   Note: when the target site blocks automated requests the action still
 *   succeeds but returns `data.error` (soft error) — callers must check for it.
 *
 * @example
 * ```tsx
 * const result = await fetchSocialMetadata('https://github.com/username')
 * if (!result.success) {
 *   showError(result.error)
 *   return null
 * }
 * if (result.data?.error) {
 *   showError(result.data.error) // soft error from blocked site
 *   return null
 * }
 * return result.data ?? null
 * ```
 */
export const fetchSocialMetadata = withServerActionErrorHandling(
  async (url: string): Promise<AuthResponse<OgMeta>> => {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user === null) {
      return { success: false, error: 'Authentication required' }
    }

    const platformKey = getPlatformConfigForUrl(url)?.key ?? 'website'
    if (!isValidSocialUrl(url, platformKey)) {
      return { success: false, error: 'Invalid or insecure URL' }
    }

    logger.info({ userId: user.id, url }, 'Fetching social metadata')
    const data = await getOgMetadata(url)
    return createServerActionSuccess(data)
  },
  { operation: 'fetchSocialMetadata' }
)
