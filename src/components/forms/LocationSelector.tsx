'use client'

import { Autocomplete, FormControl, FormHelperText, Grid, TextField } from '@mui/material'
import { ICity, ICountry, IState } from 'country-state-city'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'

import { logger } from '@/lib/logger/client'
import {
  getCities,
  getCountries,
  getCountryByCode,
  getStateByCode,
  getStates,
  detectUserCountry,
} from '@/lib/utils/location-utils'

type LocationError = {
  message?: string
  type?: string
}

interface LocationSelectorProps {
  countryName?: string
  stateName?: string
  cityName?: string
  errors?: {
    country?: LocationError
    state?: LocationError
    city?: LocationError
  }
  required?: {
    country?: boolean
    state?: boolean
    city?: boolean
  }
  disabled?: boolean
}

export function LocationSelector({
  countryName = 'country_code',
  stateName = 'state',
  cityName = 'city',
  errors,
  required = { country: true },
  disabled = false,
}: LocationSelectorProps): JSX.Element {
  const { watch, setValue, formState } = useFormContext()
  const [userDetectedCountry, setUserDetectedCountry] = useState<string | null>(null)

  // Watch form values with proper typing
  const countryValue = watch(countryName) as string | undefined
  const stateValue = watch(stateName) as string | undefined
  const cityValue = watch(cityName) as string | undefined

  // Initialize countries from static data
  const countriesList = getCountries()
  const [countries] = useState(countriesList)

  // Compute derived state based on form values
  const selectedCountry = useMemo(() => {
    if (!countryValue) return null
    return getCountryByCode(countryValue) || null
  }, [countryValue])

  const countryStates = useMemo(() => {
    if (!selectedCountry) return []
    return getStates(selectedCountry.isoCode) || []
  }, [selectedCountry])

  const selectedState = useMemo(() => {
    if (!selectedCountry || !stateValue) return null
    return getStateByCode(stateValue, selectedCountry.isoCode) || null
  }, [selectedCountry, stateValue])

  const stateCities = useMemo(() => {
    if (!selectedCountry || !selectedState) return []
    return getCities(selectedCountry.isoCode, selectedState.isoCode) || []
  }, [selectedCountry, selectedState])

  // Use computed values directly instead of state
  const states = countryStates
  const cities = stateCities

  // Load countries on component mount
  useEffect(() => {
    // Only detect user's country if no country is currently selected
    const detectCountry = async (): Promise<void> => {
      // Wait for form to be initialized with default values
      // Skip detection if country already exists in the form (including from profile data)
      if (countryValue || !formState.isReady) {
        return
      }

      try {
        const detectedCountry = await detectUserCountry()
        if (detectedCountry) {
          setUserDetectedCountry(detectedCountry.isoCode)
        }
      } catch (err: unknown) {
        logger.warn(
          { err: err instanceof Error ? err : new Error(String(err)) },
          'Failed to detect user country in LocationSelector'
        )
      }
    }

    detectCountry()
  }, [countryValue, formState.defaultValues, formState.isSubmitting, countryName, formState.isReady])

  const handleCountryChange = (country: ICountry | null): void => {
    if (country) {
      setValue(countryName, country.isoCode, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(stateName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(cityName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      setValue(countryName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(stateName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(cityName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    }
  }

  // Handle state change
  const handleStateChange = (state: IState | null): void => {
    if (state) {
      setValue(stateName, state.isoCode, {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(cityName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    } else {
      setValue(stateName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
      setValue(cityName, '', {
        shouldValidate: true,
        shouldDirty: true,
        shouldTouch: true,
      })
    }
  }

  // Handle city change
  const handleCityChange = (city: ICity | null): void => {
    setValue(cityName, city?.name || '', {
      shouldValidate: true,
      shouldDirty: true,
      shouldTouch: true,
    })
  }

  return (
    <Grid container spacing={2} sx={{ mb: 1 }}>
      <Grid size={{ xs: 12, sm: 8 }}>
        <FormControl fullWidth error={!!errors?.country} margin="none">
          <Autocomplete
            options={countries}
            getOptionLabel={(option) => option.name}
            value={selectedCountry}
            onChange={(_, newValue) => handleCountryChange(newValue)}
            onOpen={() => {
              // When dropdown is opened and no country is selected, pre-select detected country
              if (!countryValue && userDetectedCountry) {
                const detectedCountry = countries.find((country) => country.isoCode === userDetectedCountry)
                if (detectedCountry) {
                  handleCountryChange(detectedCountry)
                }
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Country"
                error={!!errors?.country}
                helperText={errors?.country?.message || ' '}
                required={required?.country}
                placeholder="Search for a country..."
                disabled={disabled}
              />
            )}
            isOptionEqualToValue={(option, value) => option.isoCode === value?.isoCode}
            disabled={disabled || !countries.length}
            filterOptions={(options, { inputValue }) =>
              options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))
            }
            noOptionsText="No countries found"
          />
          {errors?.country && <FormHelperText>{errors.country.message}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12, sm: 4 }}>
        <FormControl fullWidth error={!!errors?.state} margin="none">
          <Autocomplete
            options={states}
            getOptionLabel={(option) => option.name}
            value={selectedState}
            onChange={(_, newValue) => handleStateChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="State/Province"
                error={!!errors?.state}
                helperText={errors?.state?.message || ' '}
                required={required?.state}
                placeholder="Search for a state/province..."
                disabled={disabled}
              />
            )}
            isOptionEqualToValue={(option, value) => option?.isoCode === value?.isoCode}
            disabled={disabled || !selectedCountry || !states.length}
            filterOptions={(options, { inputValue }) =>
              options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))
            }
            noOptionsText="No states/provinces found"
          />
          {errors?.state && <FormHelperText>{errors.state.message}</FormHelperText>}
        </FormControl>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <FormControl fullWidth error={!!errors?.city} margin="none">
          <Autocomplete
            options={cities}
            getOptionLabel={(option) => option.name}
            value={cities.find((city) => city.name === cityValue) || null}
            onChange={(_, newValue) => handleCityChange(newValue)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="City"
                error={!!errors?.city}
                helperText={errors?.city?.message || ' '}
                required={required?.city}
                placeholder="Search for a city..."
                disabled={disabled}
              />
            )}
            isOptionEqualToValue={(option, value) => option?.name === value?.name}
            disabled={disabled || !selectedState || !cities.length}
            filterOptions={(options, { inputValue }) =>
              options.filter((option) => option.name.toLowerCase().includes(inputValue.toLowerCase()))
            }
            noOptionsText="No cities found"
          />
          {errors?.city && <FormHelperText>{errors.city.message}</FormHelperText>}
        </FormControl>
      </Grid>
    </Grid>
  )
}
