/**
 * Timezone Mapping Utilities
 *
 * Maps any IANA timezone identifier to one of the 64 canonical timezone regions
 * and provides UTC offset computation for timezone display.
 *
 * The 64 canonical regions come from the timezone-boundary-builder "now" variant,
 * which groups all IANA timezones by their current observance rules.
 *
 * @module timezoneMapping
 * @see {@link https://github.com/evansiroky/timezone-boundary-builder}
 */

/**
 * Get the current UTC offset in minutes for a given IANA timezone.
 * Uses the Intl API to parse the UTC offset string.
 *
 * @param timezone - IANA timezone identifier (e.g. "America/New_York")
 * @returns UTC offset in minutes (e.g. -300 for EST, 330 for IST)
 *
 * @example
 * ```typescript
 * getUtcOffsetMinutes('America/New_York') // -300 (UTC-5) or -240 (UTC-4 during DST)
 * getUtcOffsetMinutes('Asia/Kolkata')     // 330 (UTC+5:30)
 * ```
 */
export function getUtcOffsetMinutes(timezone: string): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      timeZoneName: 'longOffset',
    })
    const parts = formatter.formatToParts(new Date())
    const tzPart = parts.find((p) => p.type === 'timeZoneName')?.value ?? ''

    // Parse "GMT+05:30" or "GMT-05:00" or "GMT"
    const match = tzPart.match(/GMT([+-])(\d{2}):(\d{2})/)
    if (!match) return 0 // GMT/UTC

    const [, signChar, hoursStr, minutesStr] = match
    if (!signChar || !hoursStr || !minutesStr) return 0

    const sign = signChar === '+' ? 1 : -1
    const hours = parseInt(hoursStr, 10)
    const minutes = parseInt(minutesStr, 10)
    return sign * (hours * 60 + minutes)
  } catch {
    return 0
  }
}

/**
 * Get the current UTC offset expressed as hours (minutes/60).
 * This returns a fractional hour value (e.g. 5.5 for IST) and is suitable
 * for calculations that require sub-hour offsets.
 *
 * @param timezone - IANA timezone identifier
 * @returns UTC offset in hours (fractional, e.g. 5.5)
 *
 * @example
 * ```typescript
 * getUtcOffsetHour('America/New_York') // -5 (or -4 during DST)
 * getUtcOffsetHour('Asia/Kolkata')     // 5.5
 * ```
 */
export function getUtcOffsetHour(timezone: string): number {
  const minutes = getUtcOffsetMinutes(timezone)
  // Return a float hour value (e.g. 5.5 for IST) instead of rounding.
  return minutes / 60
}
