import type { ReactElement } from 'react'
import { Grid, TextField } from '@mui/material'
import MuiPhoneNumber from '@mmerlone/mui7-phone-number'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection } from '@/components/forms/FormSection'
import { FormFieldSkeleton } from '@/components/forms/FormFieldSkeleton'
import { type ProfileFormValues } from '@/lib/validators/profile'

interface ContactInfoProps {
  errors: Partial<Record<string, { message?: string }>>
  disabled?: boolean
  isLoading?: boolean
}

export function ContactInfo({ errors, disabled = false, isLoading = false }: ContactInfoProps): ReactElement {
  const { control } = useFormContext<ProfileFormValues>()
  return (
    <FormSection title="Contact Information">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <MuiPhoneNumber
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  defaultCountry="us"
                  disableAreaCodes={true}
                  disabled={disabled}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
                  value={field.value ?? ''}
                  onChange={(value) => field.onChange(value)}
                  onBlur={() => field.onBlur()}
                />
              )}
            />
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Website"
                  variant="outlined"
                  placeholder="https://example.com"
                  disabled={disabled}
                  error={Boolean(errors.website)}
                  helperText={errors.website?.message}
                  value={field.value ?? ''}
                />
              )}
            />
          )}
        </Grid>
      </Grid>
    </FormSection>
  )
}
