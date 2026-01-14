/**
 * Timezone Utilities
 *
 * Provides functions for working with IANA timezones using moment-timezone.
 * Supports both client and server environments through isomorphic logger.
 */

import moment from 'moment-timezone'
import { buildIsomorphicLogger } from '@/lib/logger/isomorphic'

import { Timezone } from '@/types/timezone.types'

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
  const timezoneNames = moment.tz.names()
  const now = moment()

  const timezones = timezoneNames.map((name: string) => {
    const zone = moment.tz.zone(name)
    const timestamp = now.valueOf()
    const offsetInMinutes = zone?.utcOffset(timestamp) ?? 0
    const offsetInHours = offsetInMinutes / 60
    const offsetFormatted = `UTC${offsetInHours < 0 ? '+' : '-'}${offsetInHours}`
    const displayName = name.replace(/_/g, ' ')

    return {
      value: name,
      label: `${displayName} (${offsetFormatted})`,
      offset: offsetInHours,
    }
  })

  return timezones.sort((a, b) => {
    return a.value.localeCompare(b.value)
  })
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
    const guessedTz = moment.tz.guess()

    if (!guessedTz) {
      const timezone = Intl?.DateTimeFormat().resolvedOptions().timeZone
      return timezone || 'UTC'
    }

    return guessedTz
  } catch (err) {
    logger.warn({ err }, 'Could not determine timezone, using UTC as fallback')
    return 'UTC'
  }
}
