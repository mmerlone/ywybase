'use client'

import { Box } from '@mui/material'
import { type FieldErrors } from 'react-hook-form'

import { AccountDetails } from './sections/AccountDetails'
import { ContactInfo } from './sections/ContactInfo'
import { LocationInfo } from './sections/LocationInfo'
import { PersonalInfo } from './sections/PersonalInfo'
import { ProfessionalInfo } from './sections/ProfessionalInfo'

import { type ProfileFormValues } from '@/lib/validators/profile'

interface TabProfileProps {
  errors: FieldErrors<ProfileFormValues>
  disabled: boolean
}

export function TabProfile({ errors, disabled }: TabProfileProps): JSX.Element {
  return (
    <Box>
      <AccountDetails errors={errors} disabled={disabled} />
      <PersonalInfo errors={errors} disabled={disabled} />
      <ContactInfo errors={errors} disabled={disabled} />
      <LocationInfo disabled={disabled} />
      <ProfessionalInfo errors={errors} disabled={disabled} />
    </Box>
  )
}
