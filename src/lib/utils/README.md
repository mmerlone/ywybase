# Utils Library

Common utility functions for cookies, location services, profile management, and timezone handling.

## 🚀 **Quick Start**

```typescript
// Cookie management
import { getDefaultCookiePreferences, mergeCookiePreferences } from '@/lib/utils/cookie-utils'
const defaults = getDefaultCookiePreferences()
const merged = mergeCookiePreferences({ analytics: true }, { marketing: false })

// Location services
import { getCountries, detectUserCountry } from '@/lib/utils/location-utils'
const countries = getCountries()
const userCountry = await detectUserCountry()

// Profile utilities
import { convertDbProfile, convertAppProfileForUpdate } from '@/lib/utils/profile-utils'
const profile = convertDbProfile(dbProfileData)
const updateData = convertAppProfileForUpdate(appProfile)

// Timezone support
import { getTimezones, getCurrentTimezone } from '@/lib/utils/timezone'
const timezones = getTimezones()
const userTimezone = getCurrentTimezone()

// Get default preferences
const defaults = getDefaultCookiePreferences()

// Merge with user preferences
const merged = mergeCookiePreferences({ analytics: true }, { marketing: false })

// Validate and ensure proper structure
const validated = ensureCookiePreferences(userPreferences)
```

### Location Services

```typescript
import { getCountries, getStates, getCities, detectUserCountry } from '@/lib/utils/location-utils'

// Get all countries
const countries = getCountries()

// Get states for a country
const usStates = getStates('US')

// Get cities for a state
const californiaCities = getCities('US', 'CA')

// Detect user's country
const userCountry = await detectUserCountry()
```

### Profile Utilities

```typescript
import { convertDbProfile, convertAppProfileForInsert, convertAppProfileForUpdate } from '@/lib/utils/profile-utils'

// Convert database profile to app format
const profile = convertDbProfile(dbProfileData)

// Convert app profile for database insertion
const insertData = convertAppProfileForInsert(appProfile)

// Convert app profile for database update
const updateData = convertAppProfileForUpdate(appProfile)
```

### Timezone Support

```typescript
import { getTimezones, getCurrentTimezone } from '@/lib/utils/timezone'

// Get all available timezones
const timezones = getTimezones()

// Get user's current timezone
const userTimezone = getCurrentTimezone()
```

## API Reference

### Cookie Utils

#### getDefaultCookiePreferences()

Returns the default cookie preferences configuration.

```typescript
const defaults = getDefaultCookiePreferences()
// Returns: { necessary: true, analytics: false, marketing: false, functional: false }
```

**Returns**: `CookiePreferences` - Default preference object

#### mergeCookiePreferences(base, overrides)

Merges cookie preferences with defaults and optional overrides.

```typescript
const merged = mergeCookiePreferences(
  { analytics: true }, // base preferences
  { marketing: true } // overrides
)
```

**Parameters**:

- `base` - Base preferences to merge with defaults
- `overrides` - Preferences that override base and defaults

**Returns**: `CookiePreferences` - Merged preference object

#### ensureCookiePreferences(preferences)

Validates and ensures proper cookie preferences structure.

```typescript
const validated = ensureCookiePreferences(userInput)
```

**Parameters**:

- `preferences` - User-provided preferences object

**Returns**: `CookiePreferences` - Validated preference object

### Location Utils

#### getCountries()

Gets all available countries with type safety.

```typescript
const countries = getCountries()
// Returns: [{ name: "United States", isoCode: "US" }, ...]
```

**Returns**: `ICountry[]` - Array of country objects

#### getStates(countryCode)

Gets all states/provinces for a given country.

```typescript
const states = getStates('US')
// Returns: [{ name: "California", isoCode: "CA" }, ...]
```

**Parameters**:

- `countryCode` - ISO country code (e.g., "US")

**Returns**: `IState[]` - Array of state objects

#### getCities(countryCode, stateCode?)

Gets cities for a country and optionally a state.

```typescript
// All cities in US
const usCities = getCities('US')

// Cities in California
const caCities = getCities('US', 'CA')
```

**Parameters**:

- `countryCode` - ISO country code
- `stateCode` - Optional ISO state code

**Returns**: `ICity[]` - Array of city objects

#### detectUserCountry()

Detects the user's country based on IP geolocation.

```typescript
const country = await detectUserCountry()
// Returns: { name: "United States", isoCode: "US" } or null
```

**Returns**: `Promise<ICountry | null>` - Detected country or null

### Profile Utils

#### convertDbProfile(dbProfile)

Converts database profile format to application format.

```typescript
const profile = convertDbProfile(dbProfileData)
```

**Parameters**:

- `dbProfile` - Database profile object

**Returns**: `Profile` - Application profile object

#### convertAppProfileForInsert(profile)

Converts application profile for database insertion.

```typescript
const insertData = convertAppProfileForInsert(appProfile)
```

**Parameters**:

- `profile` - Application profile object

**Returns**: `DbProfileInsert` - Database insert format

#### convertAppProfileForUpdate(profile)

Converts application profile for database update.

```typescript
const updateData = convertAppProfileForUpdate(appProfile)
```

**Parameters**:

- `profile` - Application profile object

**Returns**: `DbProfileUpdate` - Database update format

### Timezone Utils

#### getTimezones()

Gets all available IANA timezones with current offsets.

```typescript
const timezones = getTimezones()
// Returns: [{ value: "America/New_York", label: "America/New York (UTC-5)", offset: -5 }, ...]
```

**Returns**: `Timezone[]` - Array of timezone objects

#### getCurrentTimezone()

Gets the user's current timezone using browser detection.

```typescript
const timezone = getCurrentTimezone()
// Returns: "America/New_York" or similar IANA timezone
```

**Returns**: `string` - IANA timezone identifier

## Integration Examples

### Cookie Consent Component

```typescript
'use client'

import { useState } from 'react'
import { mergeCookiePreferences, ensureCookiePreferences } from '@/lib/utils/cookie-utils'

export function CookieConsent() {
  const [preferences, setPreferences] = useState(getDefaultCookiePreferences())

  const handleSave = (newPrefs: Partial<CookiePreferences>) => {
    const merged = mergeCookiePreferences(preferences, newPrefs)
    const validated = ensureCookiePreferences(merged)
    setPreferences(validated)
    // Save to localStorage, API, etc.
  }

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={preferences.analytics}
          onChange={(e) => handleSave({ analytics: e.target.checked })}
        />
        Analytics Cookies
      </label>
    </div>
  )
}
```

### Location Selector Component

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getCountries, getStates, getCities, detectUserCountry } from '@/lib/utils/location-utils'

export function LocationSelector() {
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedState, setSelectedState] = useState('')
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])

  useEffect(() => {
    // Load countries
    setCountries(getCountries())

    // Detect user's country
    detectUserCountry().then(country => {
      if (country) {
        setSelectedCountry(country.isoCode)
      }
    })
  }, [])

  useEffect(() => {
    if (selectedCountry) {
      setStates(getStates(selectedCountry))
      setSelectedState('')
      setCities([])
    }
  }, [selectedCountry])

  useEffect(() => {
    if (selectedState) {
      setCities(getCities(selectedCountry, selectedState))
    }
  }, [selectedCountry, selectedState])

  return (
    <div>
      <select value={selectedCountry} onChange={(e) => setSelectedCountry(e.target.value)}>
        <option value="">Select Country</option>
        {countries.map(country => (
          <option key={country.isoCode} value={country.isoCode}>
            {country.name}
          </option>
        ))}
      </select>

      {states.length > 0 && (
        <select value={selectedState} onChange={(e) => setSelectedState(e.target.value)}>
          <option value="">Select State</option>
          {states.map(state => (
            <option key={state.isoCode} value={state.isoCode}>
              {state.name}
            </option>
          ))}
        </select>
      )}

      {cities.length > 0 && (
        <select>
          <option value="">Select City</option>
          {cities.map(city => (
            <option key={city.name} value={city.name}>
              {city.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
```

### Profile Management

```typescript
import { getProfile } from '@/lib/actions/profile'
import { convertDbProfile } from '@/lib/utils/profile-utils'

export async function getUserProfile(userId: string) {
  const result = await getProfile(userId)
  if (!result.success || !result.data) return null
  return convertDbProfile(result.data)
}
```

### Timezone Selector

```typescript
'use client'

import { useState, useEffect } from 'react'
import { getTimezones, getCurrentTimezone } from '@/lib/utils/timezone'

export function TimezoneSelector() {
  const [timezones, setTimezones] = useState([])
  const [selectedTimezone, setSelectedTimezone] = useState('')

  useEffect(() => {
    setTimezones(getTimezones())
    setSelectedTimezone(getCurrentTimezone())
  }, [])

  return (
    <select value={selectedTimezone} onChange={(e) => setSelectedTimezone(e.target.value)}>
      {timezones.map(tz => (
        <option key={tz.value} value={tz.value}>
          {tz.label}
        </option>
      ))}
    </select>
  )
}
```

## Best Practices

### 1. Cookie Management

```typescript
// ✅ Good - Always validate user input
const validated = ensureCookiePreferences(userInput)

// ✅ Good - Use proper merging
const merged = mergeCookiePreferences(defaults, userInput)

// ❌ Avoid - Direct assignment without validation
const invalid = userInput as CookiePreferences
```

### 2. Location Services

```typescript
// ✅ Good - Handle null results gracefully with proper logging
import { buildLogger } from '@/lib/logger'

const logger = buildLogger('location-utils')

const country = await detectUserCountry()
if (country) {
  logger.info({ countryCode: country.isoCode }, `Detected country: ${country.name}`)
}

// ✅ Good - Cache results when possible
const cachedCountries = useMemo(() => getCountries(), [])

// ❌ Avoid - Blocking UI with geolocation
// Don't call detectUserCountry() in render without proper loading states
```

### 3. Profile Conversions

```typescript
// ✅ Good - Use proper conversion functions
const profile = convertDbProfile(dbData)
const insertData = convertAppProfileForInsert(appData)

// ✅ Good - Handle conversion errors
try {
  const profile = convertDbProfile(dbData)
} catch (error) {
  console.error('Profile conversion failed:', error)
  return null
}

// ❌ Avoid - Manual field mapping
const manual = {
  id: dbData.id,
  displayName: dbData.display_name, // Error-prone
}
```

### 4. Timezone Handling

```typescript
// ✅ Good - Use timezone-aware operations
const userTimezone = getCurrentTimezone()
const localTime = moment.tz(date, userTimezone)

// ✅ Good - Provide fallbacks
const timezone = getCurrentTimezone() || 'UTC'

// ❌ Avoid - Assuming timezone
const localTime = moment(date) // May use server timezone
```

## Performance Considerations

### 1. Location Data Caching

```typescript
// Cache country data to avoid repeated processing
const countriesCache = new Map<string, ICountry[]>()

export const getCountriesCached = (): ICountry[] => {
  if (!countriesCache.has('all')) {
    countriesCache.set('all', getCountries())
  }
  return countriesCache.get('all')!
}
```

### 2. Debounced Geolocation

```typescript
// Debounce geolocation requests
import { debounce } from 'lodash-es'

const debouncedDetectCountry = debounce(detectUserCountry, 1000)

export const getUserCountry = async () => {
  return await debouncedDetectCountry()
}
```

### 3. Lazy Loading

```typescript
// Load timezones only when needed
let timezonesCache: Timezone[] | null = null

export const getTimezonesLazy = (): Timezone[] => {
  if (!timezonesCache) {
    timezonesCache = getTimezones()
  }
  return timezonesCache
}
```

## Error Handling

### Cookie Validation

```typescript
export const safeEnsureCookiePreferences = (input: unknown): CookiePreferences => {
  try {
    return ensureCookiePreferences(input)
  } catch (error) {
    console.warn('Invalid cookie preferences, using defaults:', error)
    return getDefaultCookiePreferences()
  }
}
```

### Location Services

```typescript
export const safeDetectUserCountry = async (): Promise<ICountry | null> => {
  try {
    return await detectUserCountry()
  } catch (error) {
    console.warn('Failed to detect country:', error)
    return null
  }
}
```

### Profile Conversions

```typescript
export const safeConvertDbProfile = (dbProfile: unknown): Profile | null => {
  try {
    return convertDbProfile(dbProfile)
  } catch (error) {
    console.warn('Failed to convert profile:', error)
    return null
  }
}
```

## Testing

### Unit Tests Example

```typescript
import { describe, it, expect } from 'vitest'
import { mergeCookiePreferences, ensureCookiePreferences } from '@/lib/utils/cookie-utils'

describe('Cookie Utils', () => {
  it('should merge preferences correctly', () => {
    const result = mergeCookiePreferences({ analytics: true }, { marketing: true })

    expect(result).toEqual({
      necessary: true,
      analytics: true,
      marketing: true,
      functional: false,
    })
  })

  it('should ensure valid preferences', () => {
    const invalid = { analytics: 'maybe' } as any
    const result = ensureCookiePreferences(invalid)

    expect(result.analytics).toBe(false) // Should default to false
  })
})
```

## Migration Guide

### From Manual Cookie Handling

```typescript
// Before
const cookiePrefs = {
  necessary: true,
  analytics: userPrefs.analytics || false,
  marketing: userPrefs.marketing || false,
}

// After
const cookiePrefs = mergeCookiePreferences(getDefaultCookiePreferences(), userPrefs)
```

### From Direct Profile Mapping

```typescript
// Before
const profile = {
  id: dbData.id,
  displayName: dbData.display_name,
  avatarUrl: dbData.avatar_url,
}

// After
const profile = convertDbProfile(dbData)
```

### From Manual Timezone Detection

```typescript
// Before
const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

// After
const timezone = getCurrentTimezone()
```

## Contributing

When adding new utilities:

1. **Type Safety**: Always include proper TypeScript types
2. **Error Handling**: Handle edge cases and invalid input
3. **Documentation**: Add JSDoc comments with examples
4. **Testing**: Include unit tests for new functions
5. **Performance**: Consider caching for expensive operations

### Adding a New Utility

````typescript
// utils/new-util.ts
import { createLogger } from '@/lib/logger'

const logger = createLogger({ name: 'new-util' })

/**
 * Description of the utility function
 * @param param - Description of parameter
 * @returns Description of return value
 * @example
 * ```typescript
 * const result = newUtilityFunction('input')
 * ```
 */
export const newUtilityFunction = (param: string): string => {
  try {
    logger.debug({ param }, 'Executing new utility')
    // Implementation here
    return param.toUpperCase()
  } catch (error) {
    logger.error({ error, param }, 'New utility failed')
    throw error
  }
}
````

---

**Last Updated**: 2025-11-30  
**Version**: 1.0.0  
**Dependencies**: moment-timezone, country-state-city
