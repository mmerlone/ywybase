import { Autocomplete, Grid, TextField } from '@mui/material'
import { useEffect, useState } from 'react'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection, FormFieldSkeleton } from '@/components/forms'
import { LocationSelector } from '@/components/forms/LocationSelector'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { logger } from '@/lib/logger/client'
import { getTimezones } from '@/lib/utils/timezone'
import { ProfileFormValues } from '@/lib/validators'
import { Timezone } from '@/types/timezone.types'

interface LocationInfoProps {
  disabled?: boolean
  isLoading?: boolean
}

export function LocationInfo({ disabled = false, isLoading: isFormLoading = false }: LocationInfoProps): JSX.Element {
  const {
    control,
    formState: { errors },
  } = useFormContext<ProfileFormValues>()
  const [timezones, setTimezones] = useState<Timezone[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [userDetectedTz, setUserDetectedTz] = useState<string | null>(null)
  const { showError } = useSnackbar()

  useEffect(() => {
    const loadTimezones = (): void => {
      try {
        const tzList = getTimezones()
        setTimezones(tzList as Timezone[])

        // Get user's detected timezone if available
        try {
          const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone
          setUserDetectedTz(detectedTz)
        } catch {
          logger.warn({}, "Could not detect user's timezone")
        }
      } catch (err: unknown) {
        logger.error({ err: err instanceof Error ? err : new Error(String(err)) }, 'Failed to load timezones')
        showError('Failed to load timezone data. Using default timezones.')
      } finally {
        setIsLoading(false)
      }
    }

    loadTimezones()
  }, [showError]) // Add showError to the dependency array

  return (
    <FormSection title="Location & Timezone">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12 }}>
          {isFormLoading ? (
            <FormFieldSkeleton />
          ) : (
            <LocationSelector
              countryName="country_code"
              stateName="state"
              cityName="city"
              errors={{
                country: errors.country_code,
                state: errors.state,
                city: errors.city,
              }}
              required={{
                country: false,
                state: false,
                city: false,
              }}
              disabled={disabled}
            />
          )}
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        {/* Timezone */}
        <Grid size={{ xs: 12, sm: 6, md: 6 }}>
          {isFormLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="timezone"
              control={control}
              render={({ field }): JSX.Element => {
                // Only set value if it exists in the timezones list, otherwise use empty string
                const value =
                  field.value !== null && field.value !== undefined && timezones.some((tz) => tz.value === field.value)
                    ? String(field.value)
                    : ''

                return (
                  <Autocomplete
                    options={timezones}
                    value={value ? timezones.find((tz) => tz.value === value) || null : null}
                    onChange={(_, newValue) => {
                      field.onChange(newValue?.value ?? null)
                    }}
                    onOpen={() => {
                      // When dropdown is opened and no timezone is selected, pre-select detected timezone
                      if ((!field.value || field.value === '') && userDetectedTz && timezones.length > 0) {
                        const detectedTzOption = timezones.find((tz) => tz.value === userDetectedTz)
                        if (detectedTzOption) {
                          field.onChange(detectedTzOption.value)
                        }
                      }
                    }}
                    getOptionLabel={(option) => option.label}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Timezone"
                        variant="outlined"
                        error={!!errors.timezone}
                        helperText={errors.timezone?.message?.toString() ?? ' '}
                        placeholder={
                          field.value === null || field.value === undefined
                            ? 'Select your timezone...'
                            : 'Search for a timezone...'
                        }
                      />
                    )}
                    disabled={isLoading || disabled}
                    filterOptions={(options, { inputValue }) =>
                      options.filter(
                        (option) =>
                          option.label.toLowerCase().includes(inputValue.toLowerCase()) ||
                          option.value.toLowerCase().includes(inputValue.toLowerCase())
                      )
                    }
                    noOptionsText="No timezones found"
                    isOptionEqualToValue={(option, value) => option.value === value?.value}
                    slotProps={{
                      paper: {
                        style: {
                          maxHeight: 300,
                          overflow: 'hidden',
                        },
                      },
                      listbox: {
                        style: {
                          maxHeight: 300,
                        },
                      },
                    }}
                    sx={{
                      '& .MuiAutocomplete-inputRoot': {
                        paddingRight: '32px !important',
                      },
                    }}
                  />
                )
              }}
            />
          )}
        </Grid>

        {/* Timezone Note */}
        <Grid size={{ xs: 12 }}>
          <Grid
            sx={{
              mt: 1,
              fontSize: '0.875rem',
              color: 'text.secondary',
              fontStyle: 'italic',
            }}>
            Your local time will be used for scheduling and notifications.
          </Grid>
        </Grid>
      </Grid>
    </FormSection>
  )
}

export default LocationInfo
