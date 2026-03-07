import { type ICountry, type IState, type ICity, Country, State, City } from 'country-state-city'
import { buildIsomorphicLogger } from '@/lib/logger/isomorphic'

import { detectCountry } from '@/lib/actions/location'
import { getCurrentTimezone } from '@/lib/utils/timezone'

const logger = buildIsomorphicLogger('location-utils')

// Note: This utility can be used in both client and server environments
// Uses isomorphic logger to handle both contexts correctly

// Cache for detected country to avoid multiple API calls
let cachedCountry: ICountry | null = null
let detectionPromise: Promise<ICountry | null> | null = null

// Re-export the main constructors/helpers from the upstream package so callers
// can access the raw implementations when needed.
export { Country, State, City }

/**
 * Get all countries with type safety.
 *
 * This wrapper provides type-safe access to the library's data while
 * trusting the library's own type definitions.
 *
 * @returns {ICountry[]} Array of country objects with `name` and `isoCode`.
 */
export const getCountries = (): ICountry[] => {
  return Country.getAllCountries()
}

/**
 * Get all states for a given country code with type safety.
 *
 * @param {string} countryCode - ISO code of the country (e.g. "US").
 * @returns {IState[]} Array of state/province objects for the provided country.
 */
export const getStates = (countryCode: string): IState[] => {
  return State.getStatesOfCountry(countryCode)
}

/**
 * Get cities for a given country and optionally a state with type safety.
 *
 * When `stateCode` is provided, returns cities for that state. Otherwise
 * returns cities for the whole country.
 *
 * @param {string} countryCode - ISO code of the country (e.g. "US").
 * @param {string} [stateCode] - Optional ISO code of the state/province.
 * @returns {ICity[]} Array of city objects.
 */
export const getCities = (countryCode: string, stateCode?: string): ICity[] => {
  return stateCode !== null && stateCode !== undefined
    ? City.getCitiesOfState(countryCode, stateCode)
    : (City.getCitiesOfCountry(countryCode) ?? [])
}

/**
 * Find a country by its ISO code.
 *
 * @param {string} countryCode - ISO code of the country to search for.
 * @returns {ICountry | undefined} The matching country or `undefined` if not found.
 */
export function getCountryByCode(countryCode: string): ICountry | undefined {
  return Country.getCountryByCode(countryCode)
}

/**
 * Find a state by its ISO code within a given country.
 *
 * @param {string} stateCode - ISO code of the state/province.
 * @param {string} countryCode - ISO code of the country that contains the state.
 * @returns {IState | undefined} The matching state or `undefined` if not found.
 */
export function getStateByCode(stateCode: string, countryCode: string): IState | undefined {
  return State.getStateByCodeAndCountry(stateCode, countryCode)
}

/**
 * Find a city by its name within a specific state and country.
 *
 * Note: the upstream API identifies cities by name in the state; if you need
 * a more robust lookup consider normalizing names or matching on additional
 * fields.
 *
 * @param {string} cityName - The name of the city to find.
 * @param {string} stateCode - ISO code of the state containing the city.
 * @param {string} countryCode - ISO code of the country containing the state.
 * @returns {ICity | undefined} The matching city or `undefined` if not found.
 */
export function getCityByCode(cityName: string, stateCode: string, countryCode: string): ICity | undefined {
  const cities = getCities(countryCode, stateCode)
  return cities.find((city) => city.name === cityName)
}

/**
 * Get country by geolocation using server action.
 * This function is defined before its usage to avoid ESLint errors.
 */
export async function getCountryByGeoLocation(): Promise<string | null> {
  // Use independent Server Action for detection
  return detectCountry()
}

/**
 * Detect user's country using browser APIs and timezone information.
 *
 * This function attempts to detect the user's country using multiple methods:
 * 1. Browser locale (navigator.language) - COMMENTED FOR API TESTING
 * 2. IP geolocation API (most accurate)
 * 3. Timezone-based detection (fallback)
 *
 * Results are cached to avoid multiple API calls.
 *
 * @returns {Promise<ICountry | null>} The detected country object or null if detection fails
 */
export async function detectUserCountry(): Promise<ICountry | null> {
  // Return cached result if available
  if (cachedCountry) {
    return cachedCountry
  }

  // Return existing promise if detection is in progress
  if (detectionPromise) {
    return detectionPromise
  }

  // Start detection process
  detectionPromise = (async (): Promise<ICountry | null> => {
    // Method 1: Browser locale (e.g., 'en-US' -> 'US')
    try {
      let locale = navigator.language
      if (!locale && 'userLanguage' in navigator) {
        locale = (navigator as Navigator & { userLanguage?: string }).userLanguage ?? ''
      }

      if (locale) {
        const countryCode = locale.split('-')[1]
        if (countryCode?.length === 2) {
          const detectedCode = countryCode.toUpperCase()
          const countryByNavigator = getCountryByCode(detectedCode)
          if (countryByNavigator) {
            cachedCountry = countryByNavigator
            return countryByNavigator
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Could not detect country from locale')
    }

    // Method 2: IP geolocation API (most accurate)
    const countryByGeoLocation = await getCountryByGeoLocation()
    if (countryByGeoLocation !== null) {
      const country = getCountryByCode(countryByGeoLocation)
      if (country) {
        cachedCountry = country
        return country
      }
    }

    // Method 3: Timezone-based detection (fallback)
    try {
      const timezone = getCurrentTimezone()
      if (timezone && timezone !== 'UTC') {
        const timezoneToCountryMap: Record<string, string> = {
          'America/New_York': 'US',
          'America/Chicago': 'US',
          'America/Denver': 'US',
          'America/Los_Angeles': 'US',
          'America/Sao_Paulo': 'BR',
          'America/Mexico_City': 'MX',
          'America/Argentina/Buenos_Aires': 'AR',
          'America/Toronto': 'CA',
          'America/Vancouver': 'CA',
          'Europe/London': 'GB',
          'Europe/Paris': 'FR',
          'Europe/Berlin': 'DE',
          'Europe/Rome': 'IT',
          'Europe/Madrid': 'ES',
          'Europe/Amsterdam': 'NL',
          'Europe/Stockholm': 'SE',
          'Europe/Oslo': 'NO',
          'Europe/Copenhagen': 'DK',
          'Europe/Helsinki': 'FI',
          'Europe/Warsaw': 'PL',
          'Europe/Prague': 'CZ',
          'Europe/Budapest': 'HU',
          'Europe/Bucharest': 'RO',
          'Europe/Athens': 'GR',
          'Europe/Istanbul': 'TR',
          'Europe/Moscow': 'RU',
          'Asia/Tokyo': 'JP',
          'Asia/Shanghai': 'CN',
          'Asia/Hong_Kong': 'HK',
          'Asia/Seoul': 'KR',
          'Asia/Singapore': 'SG',
          'Asia/Bangkok': 'TH',
          'Asia/Jakarta': 'ID',
          'Asia/Manila': 'PH',
          'Asia/Kolkata': 'IN',
          'Asia/Dubai': 'AE',
          'Asia/Riyadh': 'SA',
          'Asia/Tehran': 'IR',
          'Asia/Jerusalem': 'IL',
          'Australia/Sydney': 'AU',
          'Australia/Melbourne': 'AU',
          'Pacific/Auckland': 'NZ',
          'Africa/Cairo': 'EG',
          'Africa/Johannesburg': 'ZA',
          'Africa/Lagos': 'NG',
          'Africa/Casablanca': 'MA',
        }

        const countryByTimezone = timezoneToCountryMap[timezone]
        if (countryByTimezone !== null && countryByTimezone !== undefined) {
          const country = getCountryByCode(countryByTimezone)
          if (country) {
            cachedCountry = country
            return country
          }
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Could not detect country from timezone')
    }

    // No detection method succeeded
    cachedCountry = null
    return null
  })()

  return detectionPromise
}
