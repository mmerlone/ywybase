import type React from 'react'
import type { ReactElement } from 'react'
import { Typography } from '@mui/material'

import { uiText } from './config/uiText'

import { type AuthOperations } from '@/types/auth.types'

/**
 * Dynamic header component that displays appropriate title and description
 * based on the current authentication operation
 */

interface AuthFormHeaderProps {
  operation: AuthOperations
}

export function AuthFormHeader({ operation }: AuthFormHeaderProps): ReactElement {
  const title = uiText.titles[operation]

  return (
    <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ mb: 3 }}>
      {title}
    </Typography>
  )
}
