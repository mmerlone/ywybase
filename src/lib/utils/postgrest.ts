/**
 * Utilities for working with PostgREST filters.
 */

/**
 * Escape special characters for PostgREST ILIKE filters.
 *
 * PostgREST treats %, _, ,, . and \\ as control characters inside pattern
 * expressions. This helper escapes them so user-provided input can be used
 * safely inside `ilike` filters without changing the intended search.
 *
 * @param value - Raw user input to escape
 * @returns Escaped value safe to interpolate inside `%...%` patterns
 */
export function escapePostgrestIlike(value: string): string {
  return value
    .replace(/\\/g, '\\\\') // escape backslash
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/,/g, '\\,')
    .replace(/\./g, '\\.')
}
