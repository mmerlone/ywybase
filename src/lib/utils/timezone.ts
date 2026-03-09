/**
 * Timezone Utilities
 *
 * Provides functions for working with IANA timezones using moment-timezone.
 * Supports both client and server environments through isomorphic logger.
 */

import { buildIsomorphicLogger } from '@/lib/logger/isomorphic'
import { type Timezone } from '@/types/timezone.types'
import { CANONICAL_TZ_REGIONS } from './canonicalTzRegions.generated'
import { getUtcOffsetMinutes } from './timezoneMapping'

const logger = buildIsomorphicLogger('timezone-utils')

// Note: This utility can be used in both client and server environments
// Uses isomorphic logger to handle both contexts correctly

/**
 * Get all available IANA timezones with their current UTC offsets.
 * Results are sorted alphabetically by timezone name.
 *
 * @returns Array of Timezone objects with value, label, and offset
 *
 * @example
 * ```typescript
 * const timezones = getTimezones();
 * // Returns: [
 * //   { value: 'America/New_York', label: 'America/New York (UTC-5)', offset: -5 },
 * //   { value: 'Europe/London', label: 'Europe/London (UTC+0)', offset: 0 },
 * //   ...
 * // ]
 * ```
 */
export function getTimezones(): Timezone[] {
  // Use the generated canonical list as the single source of truth. Compute
  // offsets via `getUtcOffsetMinutes` so we avoid bundling moment-timezone.
  const timezones = CANONICAL_TZ_REGIONS.map((name) => {
    const offsetMinutes = getUtcOffsetMinutes(name)
    const offsetInHours = offsetMinutes / 60
    const sign = offsetInHours >= 0 ? '+' : '-'
    const displayName = name.replace(/_/g, ' ')
    const offsetLabel = `UTC${sign}${Math.abs(offsetInHours)}`

    return {
      value: name,
      label: `${displayName} (${offsetLabel})`,
      offset: offsetInHours,
    }
  })

  return timezones.sort((a, b) => a.value.localeCompare(b.value))
}

/**
 * Format timezone offset for display
 *
 * @param timezone - IANA timezone identifier (e.g., "America/New_York")
 * @returns Formatted UTC offset string (e.g., "-5:00", "+5:30")
 *
 * @example
 * ```typescript
 * formatTimezoneOffset('America/New_York') // "-5:00" (or "-4:00" during DST)
 * formatTimezoneOffset('Asia/Kolkata')     // "+5:30"
 * ```
 */
export function formatTimezoneOffset(timezone: string): string {
  const offsetMinutes = getUtcOffsetMinutes(timezone)
  const offsetHours = offsetMinutes / 60
  const sign = offsetHours >= 0 ? '+' : '-'
  const absHours = Math.abs(offsetHours)
  const hours = Math.floor(absHours)
  const minutes = (absHours - hours) * 60
  return minutes > 0 ? `${sign}${hours}:${minutes.toString().padStart(2, '0')}` : `${sign}${hours}`
}

/**
 * Get the user's current timezone using browser or system detection.
 * Falls back to UTC if detection fails.
 *
 * @returns The IANA timezone string (e.g., 'America/New_York', 'Europe/London')
 *
 * @remarks
 * Detection methods:
 * 1. moment-timezone guess (primary)
 * 2. Intl.DateTimeFormat API (fallback)
 * 3. 'UTC' (final fallback)
 *
 * @example
 * ```typescript
 * const timezone = getCurrentTimezone();
 * // Returns: 'America/New_York' (based on user's system)
 * ```
 */
export function getCurrentTimezone(): string {
  try {
    // Prefer the standard Intl API for detection (works in browsers and Node).
    const timezone = Intl?.DateTimeFormat().resolvedOptions().timeZone
    if (timezone) return timezone
    return 'UTC'
  } catch (err) {
    logger.warn({ err }, 'Could not determine timezone, using UTC as fallback')
    return 'UTC'
  }
}
