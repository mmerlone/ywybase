'use client'

import React from 'react'
import { Box, Link, Tooltip, Typography, useTheme } from '@mui/material'
import { Phone as PhoneIcon } from '@mui/icons-material'
import { allCountries, type Country } from 'country-telephone-data'
import { PHONE_REGEX } from '@/lib/validators/profile'
import { formatNationalNumber } from '@/lib/utils/string-utils'

// Build a dial-code → primary Country map once at module level.
// Countries are sorted by priority (ascending) so the first entry for a given
// dial code is the most "canonical" country (e.g. US for +1, RU for +7).
const dialCodeToCountry: Record<string, Country> = {}
for (const country of [...allCountries].sort((a, b) => a.priority - b.priority)) {
  dialCodeToCountry[country.dialCode] ??= country
}

interface PhoneProps {
  /** Phone number string to display and format */
  phone: string | null | undefined
  /** Whether to show as a clickable link */
  showLink?: boolean
  /** Whether to show the country flag */
  showFlag?: boolean
  /** Additional CSS class names */
  className?: string
  /** Custom tooltip text */
  tooltipText?: string
  /** Whether to validate the phone number */
  validate?: boolean
  /** Whether to obfuscate the phone number */
  obfuscate?: boolean
}

interface ParsedPhone {
  /** Original phone prop */
  phone: string | null | undefined
  /** Raw national number digits (without country code or formatting) */
  nationalPhone: string
  /** Full international formatted number (e.g., '+1 (555) 123-4567') or '(555) ***-4567' if obfuscate: true */
  displayPhone: string
  /** Nationally formatted number with masking (e.g., '(555) ***-4567') */
  nationalDisplayPhone: string
  /** Country calling code (e.g., '1', '55') */
  callingCode: string | null
  /** Whether the phone number matches the validation regex */
  isValid: boolean
  /** ISO 3166-1 alpha-2 country code (e.g., 'US', 'BR') */
  country: string | null
  /** Full country name (e.g., 'United States', 'Brazil') */
  countryName: string | null
  /** Phone number as a tel: link */
  href: string
}

/**
 * Phone number display component with country detection and formatting.
 *
 * Features:
 * - Automatic country detection from phone number using country-telephone-data
 * - Country flag display using emoji flags
 * - Phone number masking for privacy (always applied)
 * - Clickable phone link (tel: protocol)
 * - International phone number formatting
 * - Fallback handling for invalid numbers
 *
 * @example
 * ```tsx
 * <Phone phone="+1 (555) 123-4567" showFlag showLink />
 * <Phone phone="+44 20 7123 4567" />
 * <Phone phone="+55 11 98765-4321" showFlag={false} />
 * ```
 */
export function Phone({
  phone,
  showLink = true,
  showFlag = true,
  className,
  tooltipText,
  validate = false,
  obfuscate = false,
}: PhoneProps): JSX.Element {
  const theme = useTheme()

  // Parse phone number to extract country info and format
  const parsePhoneResult = React.useMemo((): ParsedPhone => {
    // Handle null/undefined phone numbers
    if (!phone) {
      return {
        phone,
        isValid: false,
        country: null,
        callingCode: null,
        nationalPhone: '',
        displayPhone: '',
        nationalDisplayPhone: '',
        countryName: null,
        href: '',
      }
    }

    // Clean the phone number for parsing
    const cleanPhone = phone.replace(/[^\d+]/g, '')

    // Try to extract country calling code (longest first)
    let detectedCountry: Country | null = null
    let callingCode: string | null = null
    let nationalPhone = cleanPhone

    // Validate phone number using the centralized regex
    const isValid = PHONE_REGEX.test(phone)

    if (cleanPhone.startsWith('+')) {
      // Sort dial codes by length (longest first) to handle overlapping codes (e.g. 1284 before 1)
      const sortedCodes = Object.keys(dialCodeToCountry).sort((a, b) => b.length - a.length)

      for (const code of sortedCodes) {
        if (cleanPhone.startsWith(`+${code}`)) {
          detectedCountry = dialCodeToCountry[code] ?? null
          callingCode = code
          nationalPhone = cleanPhone.substring(code.length + 1)
          break
        }
      }
    }

    const formattedNational = formatNationalNumber(nationalPhone, detectedCountry, obfuscate)
    const internationalNumber = callingCode ? `+${callingCode} ${formattedNational}` : phone

    // Apply obfuscation if requested - only mask national number, preserve country code
    const displayPhone = obfuscate
      ? callingCode
        ? `+${callingCode} ${formatNationalNumber(nationalPhone, detectedCountry, true)}`
        : formatNationalNumber(nationalPhone, detectedCountry, true)
      : internationalNumber
    const nationalDisplayPhone = formatNationalNumber(nationalPhone, detectedCountry, obfuscate)

    // Create href with the full international number (never obfuscated)
    const href = `tel:${callingCode ? `+${callingCode}${nationalPhone}` : cleanPhone}`

    return {
      phone,
      isValid,
      country: detectedCountry?.iso2?.toUpperCase?.() ?? null,
      callingCode,
      nationalPhone, // Raw digits
      displayPhone,
      nationalDisplayPhone,
      countryName: detectedCountry?.name ?? null,
      href,
    }
  }, [phone, obfuscate])

  const { isValid, country, displayPhone, countryName, href } = parsePhoneResult

  // Handle null/undefined phone numbers
  if (!phone) {
    return (
      <Typography variant="body1" component="span" className={className}>
        -
      </Typography>
    )
  }

  // Get country flag emoji
  const getCountryFlag = (countryCode: string | null): string => {
    if (countryCode?.length !== 2) return '🌍'

    // Ensure countryCode is a valid string with only letters
    const cleanCountryCode = String(countryCode).toUpperCase().trim()
    if (!/^[A-Z]{2}$/.test(cleanCountryCode)) return '🌍'

    // Convert country code to flag emoji
    const codePoints = cleanCountryCode.split('').map((char: string) => 127397 + char.charCodeAt(0))

    return String.fromCodePoint(...codePoints)
  }

  // Create the phone content
  const phoneContent = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        className,
      }}>
      {showFlag && country && (
        <Box
          component="span"
          sx={{
            fontSize: '1.2em',
            lineHeight: 1,
            filter: isValid ? 'none' : 'grayscale(100%) opacity(0.5)',
          }}
          title={isValid ? `${countryName} (${country})` : 'Unknown country'}>
          {getCountryFlag(country)}
        </Box>
      )}

      <PhoneIcon
        sx={{
          fontSize: 16,
          color: isValid ? 'text.secondary' : 'text.disabled',
        }}
      />

      <Typography
        variant="body1"
        component="span"
        sx={{
          color: isValid ? 'inherit' : 'text.disabled',
          fontFamily: 'monospace',
        }}>
        {displayPhone}
      </Typography>

      {validate && (
        <Typography
          variant="caption"
          component="span"
          sx={{
            color: isValid ? 'success.main' : 'error.main',
            ml: 1,
            fontSize: '0.75em',
          }}>
          {isValid ? '(Valid)' : '(Invalid)'}
        </Typography>
      )}
    </Box>
  )

  // If not showing as link, just return the content
  if (!showLink) {
    return phoneContent
  }

  // Return as clickable link
  return (
    <Tooltip title={tooltipText ?? (isValid ? `Call ${displayPhone}` : 'Invalid phone number')}>
      <Link
        href={href}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          color: 'primary.main',
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
            color: 'primary.dark',
          },
          '&:focus-visible': {
            outline: `2px solid ${theme.palette.primary.main}`,
            outlineOffset: 2,
          },
        }}
        onClick={(e) => {
          if (!isValid) {
            e.preventDefault()
          }
        }}>
        {phoneContent}
      </Link>
    </Tooltip>
  )
}
