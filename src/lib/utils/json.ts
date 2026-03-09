/**
 * JSON Utilities
 *
 * Provides safe alternatives to restricted JSON methods.
 */

/**
 * Safely parse a JSON string with an optional validation/guard function.
 *
 * @param json - The JSON string to parse
 * @param guard - Optional type guard to validate the parsed object
 * @returns The parsed object of type T, or null if parsing or validation fails
 */
export function safeJsonParse<T>(json: string, guard?: (obj: unknown) => obj is T): T | null {
  try {
    // We suppress the lint rule here as this is the designated "safe" wrapper
    // eslint-disable-next-line no-restricted-syntax
    const parsed = JSON.parse(json) as unknown

    if (guard) {
      return guard(parsed) ? parsed : null
    }

    return parsed as T
  } catch {
    return null
  }
}
