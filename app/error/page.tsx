'use client'

import {
  ErrorOutline as ErrorIcon,
  Home as HomeIcon,
  Login as LoginIcon,
  Refresh as RefreshIcon,
  SupportAgent as SupportIcon,
} from '@mui/icons-material'
import { Alert, Box, Container, Typography, Button, Paper } from '@mui/material'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import React, { Suspense, type ReactElement } from 'react'
import { SITE_CONFIG } from '@/config/site'
import { type ErrorPageCode, ErrorPageCodeEnum } from '@/types/error.types'

/**
 * Interface for error display details
 */
export interface ErrorDetails {
  title: string
  message: string
  showLogin: boolean
}

/**
 * Reusable Error Page Component
 * Handles different error codes passed via query parameters
 */
function ErrorPageContent(): ReactElement {
  const searchParams = useSearchParams()
  const codeParam = searchParams.get('code')
  const code =
    codeParam !== null &&
    codeParam !== undefined &&
    Object.values(ErrorPageCodeEnum).includes(codeParam as ErrorPageCode)
      ? (codeParam as ErrorPageCode)
      : null

  const getErrorDetails = (): ErrorDetails => {
    switch (code) {
      case ErrorPageCodeEnum.VERIFICATION_FAILED:
        return {
          title: 'Verification Failed',
          message: 'We were unable to verify your email address. The link may have expired or already been used.',
          showLogin: true,
        }
      case ErrorPageCodeEnum.INVALID_VERIFICATION_LINK:
        return {
          title: 'Invalid Link',
          message: 'The verification link you followed appears to be invalid or incomplete.',
          showLogin: true,
        }
      case ErrorPageCodeEnum.AUTH_CODE_INVALID:
        return {
          title: 'Invalid Authentication Link',
          message: 'The authentication link is invalid. Please request a new link.',
          showLogin: true,
        }
      case ErrorPageCodeEnum.AUTH_LINK_EXPIRED:
        return {
          title: 'Link Expired',
          message: 'This authentication link has expired. Please request a new one.',
          showLogin: true,
        }
      case ErrorPageCodeEnum.ACCESS_DENIED:
        return {
          title: 'Access Denied',
          message: 'You do not have permission to access this resource.',
          showLogin: true,
        }
      case ErrorPageCodeEnum.CONFIGURATION_ERROR:
        return {
          title: 'Configuration Error',
          message:
            process.env.NODE_ENV === 'development'
              ? 'The application is missing required Supabase configuration. Please check your environment variables.'
              : 'The application configuration is invalid. Please contact support.',
          showLogin: false,
        }
      default:
        return {
          title: 'Something Went Wrong',
          message: 'An unexpected error occurred. Please try again later.',
          showLogin: false,
        }
    }
  }

  const { title, message, showLogin } = getErrorDetails()

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}>
      <Container maxWidth="sm">
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}>
          <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom fontWeight={600}>
            {title}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            {message}
          </Typography>

          {(code === ErrorPageCodeEnum.AUTH_LINK_EXPIRED || code === ErrorPageCodeEnum.AUTH_CODE_INVALID) && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="body2">Email verification links expire after 24 hours for security.</Typography>
            </Alert>
          )}

          {code === ErrorPageCodeEnum.CONFIGURATION_ERROR && process.env.NODE_ENV === 'development' && (
            <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
              <Typography variant="subtitle2" gutterBottom>
                Setup Instructions:
              </Typography>
              <Typography variant="body2" component="div">
                <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                  <li>
                    Copy <code>.env.sample</code> to <code>.env.local</code>
                  </li>
                  <li>
                    Get your credentials from:{' '}
                    <a
                      href="https://supabase.com/dashboard/project/_/settings/api"
                      target="_blank"
                      rel="noopener noreferrer">
                      Supabase Dashboard → Settings → API
                    </a>
                  </li>
                  <li>
                    Update these variables in <code>.env.local</code>:
                  </li>
                </ol>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto', marginTop: '0.5rem' }}>
                  {`NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx`}
                </pre>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  4. Restart the development server
                </Typography>
              </Typography>
            </Alert>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<HomeIcon />} component={Link} href="/">
              Go Home
            </Button>

            {(code === ErrorPageCodeEnum.AUTH_LINK_EXPIRED || code === ErrorPageCodeEnum.AUTH_CODE_INVALID) && (
              <Button
                variant="outlined"
                color="primary"
                startIcon={<RefreshIcon />}
                component={Link}
                href="/auth?op=resend-verification">
                Request a new link
              </Button>
            )}

            {showLogin && (
              <Button variant="outlined" startIcon={<LoginIcon />} component={Link} href="/auth">
                Login
              </Button>
            )}

            <Button variant="text" startIcon={<SupportIcon />} component={Link} href={SITE_CONFIG.support.url}>
              Contact Support
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}

export default function ErrorPage(): ReactElement {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 2,
          }}>
          <Container maxWidth="sm">
            <Paper
              elevation={3}
              sx={{
                p: 4,
                textAlign: 'center',
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
              }}>
              <Box sx={{ py: 4 }}>
                <Typography variant="h5" component="h2">
                  Loading...
                </Typography>
              </Box>
            </Paper>
          </Container>
        </Box>
      }>
      <ErrorPageContent />
    </Suspense>
  )
}
