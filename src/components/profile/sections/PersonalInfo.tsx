import { Grid, MenuItem, TextField } from '@mui/material'
import { AdapterMoment } from '@mui/x-date-pickers/AdapterMoment'
import { DatePicker } from '@mui/x-date-pickers/DatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import moment from 'moment-timezone'
import { Controller, useFormContext } from 'react-hook-form'

import { FormSection, FormFieldSkeleton } from '@/components/forms'
import { ProfileFormValues } from '@/lib/validators'

interface PersonalInfoProps {
  errors: Partial<Record<string, { message?: string }>>
  disabled?: boolean
  isLoading?: boolean
}

// Simple personal info form section with safe casts for controlled fields
export function PersonalInfo({ errors, disabled = false, isLoading = false }: PersonalInfoProps): JSX.Element {
  const { control } = useFormContext<ProfileFormValues>()

  return (
    <FormSection title="Personal Information">
      <Grid container spacing={2}>
        {/* First Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="first_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="First Name"
                  variant="outlined"
                  error={!!errors.first_name}
                  helperText={errors.first_name?.message}
                  disabled={disabled}
                  value={(field.value ?? '') as string}
                />
              )}
            />
          )}
        </Grid>

        {/* Last Name */}
        <Grid size={{ xs: 12, sm: 6 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="last_name"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  label="Last Name"
                  variant="outlined"
                  error={!!errors.last_name}
                  helperText={errors.last_name?.message}
                  disabled={disabled}
                  value={(field.value ?? '') as string}
                />
              )}
            />
          )}
        </Grid>

        {/* Gender */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="gender"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Gender"
                  variant="outlined"
                  error={!!errors.gender}
                  helperText={errors.gender?.message}
                  disabled={disabled}
                  value={(value ?? '') as string}
                  onChange={(e) => onChange((e.target as HTMLInputElement).value || null)}>
                  <MenuItem value="private">
                    <em>Prefer not to say</em>
                  </MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="non-binary">Non-binary</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </TextField>
              )}
            />
          )}
        </Grid>

        {/* Birth Date */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <LocalizationProvider dateAdapter={AdapterMoment}>
              <Controller
                name="birth_date"
                control={control}
                render={({ field: { onChange, value, ...field } }) => (
                  <DatePicker
                    {...field}
                    label="Birth Date"
                    value={value !== null && value !== undefined ? moment(String(value)) : null}
                    onChange={(date) => {
                      onChange(date ? moment(date).format('YYYY-MM-DD') : '')
                    }}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.birth_date,
                        helperText: errors.birth_date?.message,
                        disabled,
                      },
                    }}
                  />
                )}
              />
            </LocalizationProvider>
          )}
        </Grid>

        {/* Locale */}
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          {isLoading ? (
            <FormFieldSkeleton />
          ) : (
            <Controller
              name="locale"
              control={control}
              render={({ field: { value, onChange, ...field } }) => (
                <TextField
                  {...field}
                  select
                  fullWidth
                  label="Language"
                  variant="outlined"
                  error={!!errors.locale}
                  helperText={errors.locale?.message}
                  disabled={disabled}
                  value={(value ?? '') as string}
                  onChange={(e) => onChange((e.target as HTMLInputElement).value || null)}>
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="es">Español</MenuItem>
                  <MenuItem value="fr">Français</MenuItem>
                  <MenuItem value="de">Deutsch</MenuItem>
                  <MenuItem value="pt">Português</MenuItem>
                </TextField>
              )}
            />
          )}
        </Grid>

        {/* Bio */}
        <Grid size={{ xs: 12 }}>
          {isLoading ? (
            <FormFieldSkeleton height={120} />
          ) : (
            <Controller
              name="bio"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  fullWidth
                  multiline
                  rows={4}
                  label="Bio"
                  variant="outlined"
                  error={!!errors.bio}
                  helperText={errors.bio?.message ?? 'Tell us about yourself'}
                  disabled={disabled}
                  slotProps={{ htmlInput: { maxLength: 500 } }}
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

export default PersonalInfo
