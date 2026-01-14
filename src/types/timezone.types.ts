/**
 * Timezone data structure.
 * Represents a timezone with its identifier, display label, and UTC offset.
 *
 * @example
 * ```typescript
 * const timezone: Timezone = {
 *   value: 'America/New_York',
 *   label: 'Eastern Time (ET)',
 *   offset: -5
 * };
 * ```
 */
export interface Timezone {
  /** IANA timezone identifier (e.g., 'America/New_York', 'Europe/London') */
  value: string
  /** Human-readable timezone label for display */
  label: string
  /** UTC offset in hours (can be negative or positive) */
  offset: number
}
