/**
 * String Utility Functions
 *
 * Provides reusable string manipulation and normalization utilities
 * for consistent text processing across the application.
 */

import ipaddr from 'ipaddr.js'
import { type Country } from 'country-telephone-data'
import { format as formatDateFns } from 'date-fns'

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

/**
 * Checks if a string is a valid URL (any scheme).
 *
 * @param url - The URL string to validate
 * @returns true if the URL is valid, false otherwise
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return Boolean(parsed.protocol)
  } catch {
    return false
  }
}

/**
 * Checks if a URL is secure (HTTPS).
 *
 * @param url - The URL string to validate
 * @returns true if the URL is HTTPS, false otherwise
 */
export function isSecureUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Checks if a URL resolves to a private or local network address.
 * Uses ipaddr.js for IP range detection.
 *
 * @param url - The URL string to evaluate
 * @returns true if the hostname is private/local, false otherwise
 */
export function isPrivateNetworkUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const hostname = parsed.hostname.toLowerCase()

    if (hostname === 'localhost' || hostname.endsWith('.local')) return true

    if (!ipaddr.isValid(hostname)) return false

    const addr = ipaddr.parse(hostname)
    const range = addr.range()
    type IpRange = ReturnType<ipaddr.IPv4['range']> | ReturnType<ipaddr.IPv6['range']>

    const privateRanges = new Set<IpRange>([
      'private',
      'loopback',
      'linkLocal',
      'uniqueLocal',
      'unspecified',
      'reserved',
      'carrierGradeNat',
      'multicast',
      'broadcast',
    ])

    return privateRanges.has(range)
  } catch {
    return false
  }
}

/**
 * Formats a date string into a human-readable format.
 *
 * @param date - ISO date string, null, or undefined
 * @returns Formatted date string or 'Never' if no date provided
 *
 * @example
 * ```typescript
 * formatDate('2026-01-20T10:30:00Z')  // 'January 20, 2026 at 10:30 AM'
 * formatDate(null)                     // 'Never'
 * formatDate(undefined)                // 'Never'
 * formatDate('invalid')                // 'Invalid date'
 * ```
 */
export function formatDate(date: string | null | undefined): string {
  if (date === null || date === undefined) return 'Never'
  try {
    const parsed = new Date(date)
    if (isNaN(parsed.getTime())) {
      return 'Invalid date'
    }
    return formatDateFns(parsed, 'PP p')
  } catch {
    return 'Invalid date'
  }
}

/**
 * Formats a boolean value into a human-readable string.
 *
 * @param value - Boolean value, null, or undefined
 * @returns 'Yes', 'No', or 'Unknown'
 *
 * @example
 * ```typescript
 * formatBoolean(true)       // 'Yes'
 * formatBoolean(false)      // 'No'
 * formatBoolean(null)       // 'Unknown'
 * formatBoolean(undefined)  // 'Unknown'
 * ```
 */
export function formatBoolean(value?: boolean | null): string {
  if (value === null || value === undefined) return 'Unknown'
  return value ? 'Yes' : 'No'
}

/**
 * Formats a text value for display, returning a dash for empty/null/undefined values.
 *
 * @param value - String value, null, or undefined
 * @returns The trimmed string or '-' if empty/null/undefined
 *
 * @example
 * ```typescript
 * formatText('hello')       // 'hello'
 * formatText('  hello  ')   // 'hello'
 * formatText('')            // '-'
 * formatText('   ')         // '-'
 * formatText(null)          // '-'
 * formatText(undefined)     // '-'
 * ```
 */
export function formatText(value?: string | null): string {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim()
  }
  return '-'
}

/**
 * Obfuscates a phone number for privacy by showing only last 4 digits.
 *
 * @param number - The phone number to obfuscate
 * @returns Obfuscated phone number with last 4 digits visible
 *
 * @example
 * ```typescript
 * obfuscatePhoneNumber('5551234567')  // '***34567'
 * obfuscatePhoneNumber('1234')          // '1234'
 * obfuscatePhoneNumber('123')           // '123'
 * ```
 */
function obfuscatePhoneNumber(number: string): string {
  if (number.length <= 4) return number

  const visibleDigits = 4
  const maskedPart = '*'.repeat(number.length - visibleDigits)
  const visiblePart = number.slice(-visibleDigits)

  return `${maskedPart}${visiblePart}`
}

/**
 * Formats a national phone number according to country-specific patterns with optional obfuscation.
 *
 * **Origin**: Reverse-engineered from mui-phone-number library's formatNumber method.
 * Uses dot-based patterns where dots represent digit placeholders and other characters
 * are preserved as formatting (hyphens, parentheses, spaces).
 *
 * **Pattern Processing**:
 * - Removes country code from pattern if present (splits on space)
 * - Maps dots (.) to digits from input number
 * - Preserves non-dot characters as formatting
 * - Appends any remaining digits beyond pattern length
 * - Auto-closes brackets if opened but not closed
 * - Optionally obfuscates phone numbers for privacy (shows last 4 digits)
 *
 * **Use Cases**:
 * - Display phone numbers in local format for specific countries
 * - Consistent phone number formatting across the application
 * - Professional phone number presentation with optional privacy obfuscation
 *
 * @param num - National phone number digits (without country code)
 * @param country - Country object containing format pattern from country-telephone-data
 * @param obfuscate - Whether to obfuscate phone number for privacy (default: true)
 * @returns Formatted national phone number string (obfuscated or unobfuscated based on obfuscate parameter)
 *
 * @example
 * ```typescript
 * // US format with obfuscation (default): (555) ***-4567
 * formatNationalNumber('5551234567', { format: '(...) ...-....' })
 * // Returns: '(555) ***-4567'
 *
 * // US format without obfuscation: (555) 123-4567
 * formatNationalNumber('5551234567', { format: '(...) ...-....' }, false)
 * // Returns: '(555) 123-4567'
 *
 * // UK format with obfuscation: 020 *** ****
 * formatNationalNumber('2071234567', { format: '.... ... ....' })
 * // Returns: '020 *** ****'
 *
 * // Fallback for unsupported countries
 * formatNationalNumber('5551234', null)
 * // Returns: '***-1234' (obfuscated) or '555-1234' (unobfuscated)
 * ```
 */
export function formatNationalNumber(num: string, country: Country | null, obfuscate: boolean = true): string {
  if (!country || !num) return num

  // Use country-specific formatting if available (mui-phone-number approach)
  if (country?.format) {
    let pattern = country.format

    // Special handling for Brazil mobile numbers
    // Brazil mobile numbers have 9 digits after area code, but library pattern expects 8
    if (country.iso2 === 'br' && num.length >= 9) {
      // Brazil mobile format: +55 (11) 9xxxx-xxxx
      // Library provides: "+..-..-....-...." but we need "+..-..-.....-...."
      pattern = '+..-..-.....-....'
    }

    // Remove country code from pattern if present
    if (pattern.includes(' ')) {
      const patternParts = pattern.split(' ')
      // Handle patterns that start with + (country code already included in pattern)
      if (patternParts[0]?.startsWith('+')) {
        // Remove the country code part (first part with +) and keep only the national format
        patternParts.shift()
        pattern = patternParts.join(' ')
      } else {
        // Remove first part (country code without +)
        patternParts.shift()
        pattern = patternParts.join(' ')
      }
    } else if (pattern.startsWith('+')) {
      // Handle patterns like "+..-..-....-...." without spaces
      // Find where country code ends and national format begins
      const afterCountryCode = pattern.substring(2) // Skip "+."
      pattern = afterCountryCode.substring(afterCountryCode.indexOf('-') + 1) // Skip "..-" country code part
    }

    // If no pattern or auto-format disabled, return cleaned number (obfuscated or unmasked)
    if (!pattern || num.length < 2) {
      return obfuscate ? obfuscatePhoneNumber(num) : num
    }

    // Apply formatting pattern (dots are digit placeholders)
    let formattedText = ''
    const remainingText = num.split('')

    for (const character of pattern) {
      if (remainingText.length === 0) break

      if (character !== '.') {
        formattedText += character
      } else {
        formattedText += remainingText.shift()
      }
    }

    // Append any remaining digits
    const formattedNumber = formattedText + remainingText.join('')

    // Always close brackets if opened
    if (formattedNumber.includes('(') && !formattedNumber.includes(')')) {
      const finalNumber = formattedNumber + ')'
      return obfuscate ? obfuscatePhoneNumber(finalNumber) : finalNumber
    }

    return obfuscate ? obfuscatePhoneNumber(formattedNumber) : formattedNumber
  }

  // Fallback formatting for unsupported countries
  const fallbackFormatted =
    num.length <= 3
      ? num
      : num.length <= 6
        ? `${num.slice(0, 3)}-${num.slice(3)}`
        : num.length <= 10
          ? `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`
          : `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6, 10)}-${num.slice(10)}`

  return obfuscate ? obfuscatePhoneNumber(fallbackFormatted) : fallbackFormatted
}
