/**
 * @fileoverview GET /api/social-metadata
 *
 * HTTP endpoint for fetching Open Graph metadata for a social profile URL.
 * Kept for external consumers and non-action fetch contexts.
 *
 * For calls originating from within the application prefer the
 * `fetchSocialMetadata` Server Action in `src/lib/actions/social.ts` —
 * it skips the HTTP round-trip and is fully type-safe.
 *
 * @see src/lib/utils/social-metadata.ts - shared fetching/parsing/caching logic
 */
import { type NextRequest, NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/error/server'
import { logger } from '@/lib/logger/server'
import { withRateLimit } from '@/middleware/security/rate-limit'
import { getPlatformConfigForUrl } from '@/lib/utils/get-platform-from-url'
import { isValidSocialUrl } from '@/lib/utils/profile-utils'
import { getOgMetadata } from '@/lib/utils/social-metadata'

export type { OgMeta } from '@/lib/utils/social-metadata'

/**
 * GET /api/social-metadata?url=<encoded-url>
 *
 * Returns `{ title?, description?, image? }` on success, or `{ error }` when
 * the target site blocks automated requests (HTTP 200 with soft error).
 */
export const GET = withRateLimit(
  'api',
  withApiErrorHandler(async (req: NextRequest): Promise<NextResponse> => {
    const url = req.nextUrl.searchParams.get('url')
    const platformKey = getPlatformConfigForUrl(url ?? '')?.key ?? 'website'

    if (url === null || !isValidSocialUrl(url, platformKey)) {
      return NextResponse.json({ error: 'Invalid or insecure URL' }, { status: 400 })
    }

    try {
      const data = await getOgMetadata(url)
      return NextResponse.json(data)
    } catch (error) {
      logger.error({ error, url }, 'Failed to fetch OG metadata')
      return NextResponse.json(
        { error: 'Failed to fetch preview - the site may be blocking automated requests' },
        { status: 500 }
      )
    }
  })
)
