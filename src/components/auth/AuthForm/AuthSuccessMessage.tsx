import { Box, Button, Typography } from '@mui/material'

import { uiText } from './config/uiText'

import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'

/**
 * Success message component for post-submission states
 * Handles email sent confirmations and other success scenarios
 */

interface AuthSuccessMessageProps {
  operation: AuthOperations
  onBackToLogin: () => void
}

export function AuthSuccessMessage({ operation, onBackToLogin }: AuthSuccessMessageProps): JSX.Element | null {
  // For now, we only handle email sent state
  // This can be extended for other success states
  if (operation !== AuthOperationsEnum.FORGOT_PASSWORD) {
    return null
  }

  return (
    <Box sx={{ maxWidth: 400, mx: 'auto', mt: 4, textAlign: 'center' }}>
      <Typography variant="h6" gutterBottom>
        {uiText.success.emailSent}
      </Typography>
      <Typography color="textSecondary">{uiText.success.emailSentDescription}</Typography>
      <Button variant="contained" color="primary" onClick={onBackToLogin}>
        {uiText.links.backToSignIn}
      </Button>
    </Box>
  )
}
