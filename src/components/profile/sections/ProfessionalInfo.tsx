import { TextField, Grid } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection, FormFieldSkeleton } from '@/components/forms'
import { ProfileFormValues } from '@/lib/validators'

interface ProfessionalInfoProps {
  errors: Partial<Record<string, { message?: string }>>
  disabled?: boolean
  isLoading?: boolean
}

export function ProfessionalInfo({ errors, disabled = false, isLoading = false }: ProfessionalInfoProps): JSX.Element {
  const { control } = useFormContext<ProfileFormValues>()
  return (
    <FormSection title="Professional Information">
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="company"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Company"
                  variant="outlined"
                  error={!!errors.company}
                  helperText={errors.company?.message}
                  disabled={disabled}
                  value={(field.value ?? '') as string}
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
              name="job_title"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Job Title"
                  variant="outlined"
                  error={!!errors.job_title}
                  helperText={errors.job_title?.message}
                  disabled={disabled}
                  value={(field.value ?? '') as string}
                />
              )}
            />
          )}
        </Grid>
      </Grid>
    </FormSection>
  )
}
