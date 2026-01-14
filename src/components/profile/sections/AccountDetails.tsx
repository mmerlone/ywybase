import { Grid, TextField } from '@mui/material'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection, FormFieldSkeleton } from '@/components/forms'
import { ProfileFormValues } from '@/lib/validators'

interface AccountDetailsProps {
  errors: Partial<Record<string, { message?: string }>>
  disabled?: boolean
  isLoading?: boolean
}

export function AccountDetails({ errors, disabled = false, isLoading = false }: AccountDetailsProps): JSX.Element {
  const { control } = useFormContext<ProfileFormValues>()
  return (
    <FormSection title="Account Details">
      <Grid container spacing={2} sx={{ mt: 0 }}>
        {/* Display Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="display_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  required
                  label="Display Name"
                  variant="outlined"
                  error={!!errors.display_name}
                  helperText={errors.display_name?.message ?? 'This will be shown to other users'}
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
              name="email"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Email"
                  variant="outlined"
                  type="email"
                  error={!!errors.email}
                  helperText={errors.email?.message ?? '(Cannot be changed)'}
                  disabled={disabled || true}
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
