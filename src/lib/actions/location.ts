/**
 * Location Detection Server Actions
 *
 * IP-based geolocation service using ipgeolocation.io API.
 * Provides country detection with caching to minimize API usage.
 *
 * @remarks
 * **Features**:
 * - IP-based country detection
 * - In-memory LRU cache (24-hour TTL)
 * - Automatic cache eviction
 * - API rate limit protection
 * - Timeout handling (5 seconds)
 *
 * **Cache Strategy**:
 * - Results cached per IP for 24 hours
 * - Max 1000 entries (LRU eviction at 10%)
 * - Suitable for single-instance deployments
 *
 * **Production Considerations**:
 * For multi-instance deployments, consider:
 * - Redis for distributed caching
 * - Vercel KV for Vercel deployments
 * - Or accept cache misses across instances
 *
 * @module actions/location
 */

'use server'

import { buildLogger } from '@/lib/logger/server'
import { getCountryByCode } from '@/lib/utils/location-utils'

const logger = buildLogger('location-actions')

// In-memory cache for geolocation results
// Note: This is a simple in-memory cache suitable for single-instance deployments.
// In production with multiple serverless instances, consider using:
// - Redis for distributed caching
// - Vercel KV for Vercel deployments
// - Or accept potential cache misses across instances (still reduces API calls)
const geoLocationCache = new Map<string, { country: string; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours
const MAX_CACHE_SIZE = 1000 // Prevent unbounded memory growth
const CACHE_EVICTION_RATIO = 0.1 // Remove 10% of oldest entries when cache is full

/**
 * Get country from cache if available and not expired.
 *
 * @param cacheKey - Cache key (IP address or 'auto-detect')
 * @returns Country code or null if not cached/expired
 * @internal
 */
function getCachedCountry(cacheKey: string): string | null {
  const cached = geoLocationCache.get(cacheKey)

  if (!cached) return null

  // Check if cache entry is expired
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    geoLocationCache.delete(cacheKey)
    return null
  }

  return cached.country
}

/**
 * Store country in cache with LRU eviction.
 * Automatically removes oldest entries when cache reaches max size.
 *
 * @param cacheKey - Cache key (IP address or 'auto-detect')
 * @param country - Country code to cache
 * @internal
 */
function cacheCountry(cacheKey: string, country: string): void {
  // Improved LRU: if cache is full, remove oldest entries based on CACHE_EVICTION_RATIO
  if (geoLocationCache.size >= MAX_CACHE_SIZE) {
    const entriesToRemove = Math.max(1, Math.floor(MAX_CACHE_SIZE * CACHE_EVICTION_RATIO))
    const sortedEntries = Array.from(geoLocationCache.entries()).sort(([, a], [, b]) => a.timestamp - b.timestamp)

    for (let i = 0; i < entriesToRemove && i < sortedEntries.length; i++) {
      const entry = sortedEntries[i]
      if (entry) {
        geoLocationCache.delete(entry[0])
      }
    }
  }

  geoLocationCache.set(cacheKey, {
    country,
    timestamp: Date.now(),
  })
}

/**
 * Detect user's country using IP geolocation API.
 * Uses ipgeolocation.io with caching to minimize API calls.
 *
 * @param ipAddress - Optional IP address to geolocate (auto-detects if omitted)
 * @returns ISO country code (e.g., 'US', 'GB') or null if detection fails
 *
 * @remarks
 * **API Limits**: Free tier has request limits.
 * Cache reduces API calls significantly.
 *
 * **Caching**:
 * - Results cached for 24 hours
 * - Per-IP caching
 * - LRU eviction at 1000 entries
 *
 * **Error Handling**:
 * - Returns null on API failure
 * - Returns null on timeout (5s)
 * - Validates country code with country-state-city
 *
 * @example
 * ```typescript
 * // Auto-detect from request IP
 * const country = await detectCountry()
 * if (country) {
 *   console.log('Detected country:', country)
 * }
 *
 * // Detect specific IP
 * const country = await detectCountry('8.8.8.8')
 * ```
 */
export async function detectCountry(ipAddress?: string): Promise<string | null> {
  try {
    // Generate cache key (use provided IP or 'auto-detect' for auto-detection)
    const cacheKey = ipAddress ?? 'auto-detect'

    // Check cache first
    const cachedCountry = getCachedCountry(cacheKey)
    if (cachedCountry) {
      logger.debug({ cacheKey }, 'Returning cached country')
      return cachedCountry
    }

    // Get API key from server-side environment variable
    const apiKey = process.env.IPGEOLOCATION_API_KEY
    if (apiKey === null || apiKey === undefined) {
      logger.error(
        { operation: 'detectLocation', missing: 'IPGEOLOCATION_API_KEY' },
        'IPGEOLOCATION_API_KEY not found in server environment variables'
      )
      return null
    }

    logger.debug({ ipAddress }, 'Fetching country using IP geolocation API (Server Action)')

    // Build API URL with optional IP parameter
    const apiUrl = ipAddress
      ? `https://api.ipgeolocation.io/v2/ipgeo?fields=location&apiKey=${apiKey}&ip=${ipAddress}`
      : `https://api.ipgeolocation.io/v2/ipgeo?fields=location&apiKey=${apiKey}`

    // Call IP geolocation API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000),
    })

    if (!response.ok) {
      logger.warn(
        {
          status: response.status,
          statusText: response.statusText,
        },
        'Failed to fetch country from IP geolocation API (Server Action)'
      )
      return null
    }

    interface IpGeolocationResponse {
      location?: {
        country_code2?: string
      }
    }

    const data: IpGeolocationResponse = await response.json()
    const countryCode = data.location?.country_code2

    if (countryCode === null || countryCode === undefined) {
      logger.warn({ data }, 'No country code found in IP geolocation response')
      return null
    }

    // Validate country code with country-state-city module
    const country = getCountryByCode(countryCode)
    if (!country) {
      logger.warn({ countryCode }, 'Invalid country code received from API')
      return null
    }

    logger.info(
      {
        countryCode,
        countryName: country.name,
        cached: false,
      },
      'Successfully detected country from IP geolocation (Server Action)'
    )

    // Cache the result
    cacheCountry(cacheKey, country.isoCode)

    return country.isoCode
  } catch (err) {
    // Handle timeout errors specifically
    if (err instanceof Error && err.name === 'AbortError') {
      logger.warn({ message: 'Request timeout' }, 'IP geolocation API timeout')
      return null
    }

    logger.error({ err }, 'Unexpected error in IP geolocation API (Server Action)')
    return null
  }
}
