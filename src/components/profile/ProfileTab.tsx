'use client'

import { Box } from '@mui/material'
import { FieldErrors } from 'react-hook-form'

import { AccountDetails } from './sections/AccountDetails'
import { ContactInfo } from './sections/ContactInfo'
import { LocationInfo } from './sections/LocationInfo'
import { PersonalInfo } from './sections/PersonalInfo'
import { ProfessionalInfo } from './sections/ProfessionalInfo'

import { ProfileFormValues } from '@/lib/validators'

interface ProfileTabProps {
  errors: FieldErrors<ProfileFormValues>
  disabled: boolean
  isLoading?: boolean
}

export function ProfileTab({ errors, disabled, isLoading = false }: ProfileTabProps): JSX.Element {
  return (
    <Box>
      <AccountDetails errors={errors} disabled={disabled} isLoading={isLoading} />
      <PersonalInfo errors={errors} disabled={disabled} isLoading={isLoading} />
      <ContactInfo errors={errors} disabled={disabled} isLoading={isLoading} />
      <LocationInfo disabled={disabled} isLoading={isLoading} />
      <ProfessionalInfo errors={errors} disabled={disabled} isLoading={isLoading} />
    </Box>
  )
}
