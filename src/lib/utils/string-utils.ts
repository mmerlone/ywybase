/**
 * String Utility Functions
 *
 * Provides reusable string manipulation and normalization utilities
 * for consistent text processing across the application.
 */

/**
 * Normalize a string value by trimming whitespace and handling null/undefined.
 *
 * Converts null/undefined to empty string and trims whitespace from valid strings.
 * Empty strings remain as empty strings (not converted to null).
 *
 * **Use Cases**:
 * - Form field normalization before database storage
 * - Consistent handling of optional string fields
 * - Cleaning user input text
 *
 * @param value - String value to normalize (may be null or undefined)
 * @returns Normalized string (never null or undefined)
 *
 * @example
 * ```typescript
 * normalizeString('  hello  ')      // 'hello'
 * normalizeString('')               // ''
 * normalizeString('   ')            // ''
 * normalizeString(null)             // ''
 * normalizeString(undefined)        // ''
 *
 * // Use in form transformations
 * const formData = {
 *   name: normalizeString(userInput.name),
 *   bio: normalizeString(userInput.bio)
 * }
 * ```
 */
export const normalizeString = (value: string | null | undefined): string => {
  if (value === null || value === undefined) return ''
  const trimmed = value.trim()
  return trimmed === '' ? '' : trimmed
}
