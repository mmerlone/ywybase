/**
 * @fileoverview Server-side Open Graph metadata fetching utilities.
 *
 * Provides the core logic for fetching and parsing OG metadata from social
 * profile URLs. Used by both the `/api/social-metadata` route (for external
 * consumers) and the `fetchSocialMetadata` Server Action (for internal use).
 *
 * @remarks
 * This module is server-only: it makes outbound HTTP requests with a browser
 * User-Agent to bypass CORS and platform bot-detection. Never import from
 * client components directly — use the server action instead.
 *
 * @module lib/utils/social-metadata
 */

import { load } from 'cheerio'

import { buildLogger } from '@/lib/logger/server'
import { isPrivateNetworkUrl, isSecureUrl } from './string-utils'
import { getPlatformConfigForUrl } from './get-platform-from-url'
import { getOgMetaFromMapping } from './social-og'
import { isValidSocialUrl } from './profile-utils'

const logger = buildLogger('social-metadata')

/**
 * Common browser User-Agent to avoid being blocked by social platforms.
 */
const BROWSER_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const FETCH_TIMEOUT = 10000 // 10 seconds

/**
 * In-memory LRU cache for fetched metadata.
 * Shared between the API route and Server Action.
 * TODO: scale up.
 */
const LRU_CACHE = new Map<string, { data: OgMeta; ts: number }>()

/**
 * In-flight request deduplication map.
 * Concurrent calls for the same URL reuse the existing promise
 * instead of triggering duplicate outbound fetches.
 */
const IN_FLIGHT = new Map<string, Promise<OgMeta>>()

/** Maximum number of cached entries. */
export const METADATA_CACHE_MAX = 100

/** Cache TTL in milliseconds (1 hour). */
export const METADATA_CACHE_TTL = 60 * 60 * 1000

/**
 * Open Graph metadata for a social profile URL.
 */
export interface OgMeta {
  title?: string
  description?: string
  image?: string
  /** Soft-error message when the site blocks automated requests (response is still HTTP 200). */
  error?: string
}

/**
 * oEmbed/JSON API response structure (common fields).
 */
interface OEmbedResponse {
  title?: string
  author_name?: string
  author_url?: string
  thumbnail_url?: string
  html?: string
}

/**
 * Allowed characters in a social username path segment.
 * Permits alphanumerics, hyphens, underscores, dots, and at-signs.
 * Explicitly excludes `..`, `%`, `/`, and other traversal/injection sequences.
 */
const SAFE_USERNAME_RE = /^[a-zA-Z0-9._@-]+$/

/**
 * Prepares an OG endpoint URL by replacing `{url}` and `{username}` placeholders.
 *
 * The `{username}` value is extracted from the last path segment of `sourceUrl`
 * and validated against {@link SAFE_USERNAME_RE} before substitution to prevent
 * path traversal and endpoint injection.
 */
function prepareEndpoint(ogUrl: string, sourceUrl: string): string {
  let endpoint = ogUrl

  endpoint = endpoint.replace('{url}', encodeURIComponent(sourceUrl))

  if (endpoint.includes('{username}')) {
    // Extract the pathname via the URL API instead of a regex strip.
    // sourceUrl is guaranteed to be a valid HTTPS URL at this point (already
    // passed isSecureUrl / isPrivateNetworkUrl guards), so new URL() is safe.
    // This avoids the unbounded `.*` pattern that could backtrack on strings
    // with many '#' characters.
    const pathOnly = new URL(sourceUrl).pathname
    const match = pathOnly.match(/\/([^/]+)\/?$/)
    const rawUsername = match?.[1] ?? ''

    if (!SAFE_USERNAME_RE.test(rawUsername)) {
      logger.warn({ sourceUrl, rawUsername }, 'Username segment contains unsafe characters, rejecting')
      throw new Error('Invalid username in URL')
    }

    endpoint = endpoint.replace('{username}', rawUsername)
  }

  return endpoint
}

/**
 * Parses a JSON API response (oEmbed or platform-specific) into {@link OgMeta}.
 * Returns `null` if no usable fields are found.
 */
function parseJsonResponse(
  data: Record<string, unknown>,
  platform: ReturnType<typeof getPlatformConfigForUrl>,
  url: string
): OgMeta | null {
  logger.debug({ url, rawResponse: data }, 'Parsing JSON response')

  if (platform) {
    const mapped = getOgMetaFromMapping(platform, data)
    if (mapped) {
      logger.info({ url, meta: mapped }, 'Successfully mapped JSON metadata')
      return mapped
    }
  }

  // Fallback to oEmbed-style payload
  const oembedData = data as OEmbedResponse
  const meta: OgMeta = {}

  if (oembedData.title !== undefined) meta.title = oembedData.title
  else if (oembedData.author_name !== undefined) meta.title = oembedData.author_name

  if (oembedData.thumbnail_url !== undefined) meta.image = oembedData.thumbnail_url

  if (meta.title === undefined && meta.description === undefined && meta.image === undefined) {
    logger.info({ url }, 'No metadata extracted from JSON')
    return null
  }

  logger.info({ url, meta }, 'Successfully parsed JSON metadata')
  return meta
}

/**
 * Parses an HTML page's `<meta>` OG/Twitter tags into {@link OgMeta}.
 * Returns `null` if no usable fields are found.
 */
function parseHtmlResponse(html: string, url: string): OgMeta | null {
  logger.debug({ url }, 'Parsing HTML response')

  const $ = load(html)
  const meta: OgMeta = {}

  const ogTitle = $('meta[property="og:title"]').attr('content')
  const ogDescription = $('meta[property="og:description"]').attr('content')
  const ogImage = $('meta[property="og:image"]').attr('content')

  const twitterTitle = $('meta[name="twitter:title"]').attr('content')
  const twitterDescription = $('meta[name="twitter:description"]').attr('content')
  const twitterImage = $('meta[name="twitter:image"]').attr('content')

  const metaDescription = $('meta[name="description"]').attr('content')
  const pageTitle = $('title').text()

  meta.title = ogTitle ?? twitterTitle ?? pageTitle
  meta.description = ogDescription ?? twitterDescription ?? metaDescription
  meta.image = ogImage ?? twitterImage

  if (meta.title === undefined && meta.description === undefined && meta.image === undefined) {
    logger.info({ url }, 'No OG metadata found in HTML')
    return null
  }

  logger.info({ url, meta }, 'Successfully parsed HTML metadata')
  return meta
}

/**
 * Fetches and parses Open Graph metadata for the given URL.
 *
 * Prefers a platform-specific API endpoint ({@link SocialPlatformConfig.ogUrl}) when
 * available, falling back to direct HTML scraping. Always returns an `OgMeta` object;
 * on failure the object contains an `error` field instead of throwing.
 *
 * @param url - A validated HTTPS URL for a social profile
 * @returns Parsed metadata, or `{ error }` when the site blocks the request
 */
async function fetchMetadataForUrl(url: string): Promise<OgMeta> {
  // Guard against SSRF: reject non-HTTPS schemes, private/internal network
  // addresses, and URLs that do not match a known social platform.
  // Using early-return guards so static analysis can follow each boundary.
  if (!isSecureUrl(url)) {
    logger.warn({ url }, 'Rejected non-HTTPS URL')
    return { error: 'Preview not available for this platform' }
  }

  if (isPrivateNetworkUrl(url)) {
    logger.warn({ url }, 'Rejected private/internal network URL')
    return { error: 'Preview not available for this platform' }
  }

  // Determine the platform. getPlatformConfigForUrl returns null for generic
  // websites (the 'website' platform has no hostname allowlist).
  const platform = getPlatformConfigForUrl(url)
  const platformKey = platform?.key ?? 'website'

  // isValidSocialUrl re-runs isSecureUrl + isPrivateNetworkUrl and, for known
  // platforms, enforces the hostname allowlist. For 'website' it accepts any
  // valid HTTPS URL that passed the private-network check above.
  if (!isValidSocialUrl(url, platformKey)) {
    logger.warn({ url, platformKey }, 'Rejected invalid or insecure social URL')
    return { error: 'Preview not available for this platform' }
  }

  if (platform?.ogUrl === undefined || platform?.ogUrl === null) {
    // Direct server-side HTML scraping of arbitrary URLs is intentionally not
    // performed. Fetching user-supplied URLs on the server creates an SSRF
    // vector that cannot be fully mitigated without an external proxy service
    // (DNS rebinding bypasses pre-fetch IP checks). Platforms without a
    // structured API endpoint (website, Twitter/X, Instagram, etc.) should be
    // proxied through a dedicated OG service in a future iteration.
    // See: docs/ROADMAP.md — "Route OG fetching through an external service".
    logger.info({ url, platformKey }, 'No ogUrl for platform, server-side HTML scraping disabled')
    return { error: 'Preview not available for this platform' }
  }

  let endpoint: string
  try {
    endpoint = prepareEndpoint(platform.ogUrl, url)
  } catch {
    return { error: 'Preview not available for this platform' }
  }
  logger.debug({ url, endpoint, platform: platform.key }, 'Fetching metadata from endpoint')

  try {
    const res = await fetch(endpoint, {
      method: 'GET',
      headers: { Accept: 'application/json, text/html', 'User-Agent': BROWSER_USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT),
    })

    if (!res.ok) {
      logger.warn({ url, status: res.status }, 'Endpoint request failed')
      return { error: 'Preview not available for this platform' }
    }

    const contentType = res.headers.get('content-type') ?? ''
    logger.debug({ url, contentType }, 'Response Content-Type')

    if (contentType.includes('application/json')) {
      const data = (await res.json()) as Record<string, unknown>
      const meta = parseJsonResponse(data, platform, url)
      if (meta) return meta
    } else if (contentType.includes('text/html')) {
      const html = await res.text()
      const meta = parseHtmlResponse(html, url)
      if (meta) return meta
    } else {
      logger.warn({ url, contentType }, 'Unsupported Content-Type')
    }

    logger.info({ url }, 'No metadata extracted from response')
    return { error: 'Preview not available for this platform' }
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      logger.warn({ url }, 'Metadata fetch timed out')
    } else {
      logger.warn({ url, error }, 'Metadata fetch failed')
    }
    return { error: 'Preview not available for this platform' }
  }
}

/**
 * Fetches Open Graph metadata with an in-memory LRU cache (TTL: 1 hour, max: 100 entries)
 * and in-flight request deduplication.
 *
 * Concurrent calls for the same URL while a fetch is already in progress share a single
 * outbound request via the {@link IN_FLIGHT} promise map.
 *
 * This is the primary entry point consumed by both the `/api/social-metadata` API route
 * and the `fetchSocialMetadata` Server Action.
 *
 * @param url - A validated HTTPS social profile URL
 * @returns Cached or freshly fetched {@link OgMeta}
 */
export async function getOgMetadata(url: string): Promise<OgMeta> {
  const now = Date.now()

  const cached = LRU_CACHE.get(url)
  if (cached !== undefined) {
    if (now - cached.ts < METADATA_CACHE_TTL) {
      LRU_CACHE.delete(url)
      LRU_CACHE.set(url, cached) // move to end (LRU)
      return cached.data
    }
    LRU_CACHE.delete(url)
  }

  // In-flight deduplication: reuse the existing promise for concurrent callers
  const existing = IN_FLIGHT.get(url)
  if (existing !== undefined) return existing

  const promise = fetchMetadataForUrl(url)
    .then((data) => {
      // Only cache successful results, not soft errors
      if (data.error === undefined) {
        if (LRU_CACHE.size >= METADATA_CACHE_MAX) {
          const firstKey = LRU_CACHE.keys().next().value
          if (firstKey !== undefined) LRU_CACHE.delete(firstKey)
        }
        LRU_CACHE.set(url, { data, ts: Date.now() })
      }
      return data
    })
    .finally(() => {
      IN_FLIGHT.delete(url)
    })

  IN_FLIGHT.set(url, promise)
  return promise
}
