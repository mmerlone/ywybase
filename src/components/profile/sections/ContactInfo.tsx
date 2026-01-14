import { Grid, TextField } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection, FormFieldSkeleton } from '@/components/forms'
import { ProfileFormValues } from '@/lib/validators'

interface ContactInfoProps {
  errors: Partial<Record<string, { message?: string }>>
  disabled?: boolean
  isLoading?: boolean
}

export function ContactInfo({ errors, disabled = false, isLoading = false }: ContactInfoProps): JSX.Element {
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
                <TextField
                  {...field}
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={disabled}
                  value={field.value ?? ''}
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
                  error={!!errors.website}
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
