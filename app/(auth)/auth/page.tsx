import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Container, Typography } from '@mui/material'
import type { Metadata } from 'next'

import AuthForm from '@/components/auth/AuthForm'
import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'
import { SITE_CONFIG } from '@/config/site'

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Login or create a new account',
}

interface PageProps {
  searchParams: Promise<{ op?: string }>
}

export default async function AuthPage({ searchParams }: PageProps): Promise<ReactElement> {
  // Get the operation from search params (this is automatically handled by Next.js)
  const { op } = await searchParams
  const normalized = op?.toLowerCase() ?? null
  const initialOperation = ((): AuthOperations | null => {
    switch (normalized) {
      case AuthOperationsEnum.LOGIN:
        return AuthOperationsEnum.LOGIN
      case AuthOperationsEnum.SIGN_UP:
        return AuthOperationsEnum.SIGN_UP
      case AuthOperationsEnum.FORGOT_PASSWORD:
        return AuthOperationsEnum.FORGOT_PASSWORD
      case AuthOperationsEnum.SET_PASSWORD:
        return AuthOperationsEnum.SET_PASSWORD
      case AuthOperationsEnum.UPDATE_PASSWORD:
        return AuthOperationsEnum.UPDATE_PASSWORD
      case AuthOperationsEnum.RESEND_VERIFICATION:
        return AuthOperationsEnum.RESEND_VERIFICATION
      default:
        return AuthOperationsEnum.LOGIN
    }
  })()
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          py: 8,
        }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{
            mb: 6,
            textAlign: 'center',
            fontWeight: 500,
          }}>
          Welcome to {SITE_CONFIG.name}
        </Typography>
        <AuthForm initialOperation={initialOperation ?? undefined} />
      </Box>
    </Container>
  )
}
