import { Grid, TextField } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection } from '@/components/forms/FormSection'
import { FormFieldSkeleton } from '@/components/forms/FormFieldSkeleton'
import { type ProfileFormValues } from '@/lib/validators/profile'

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
                  placeholder="+1 (555) 123-4567"
                  disabled={disabled}
                  error={Boolean(errors.phone)}
                  helperText={errors.phone?.message}
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
