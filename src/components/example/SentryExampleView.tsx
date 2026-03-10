'use client'

import {
  Alert,
  Box,
  Button,
  Container,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link as MuiLink,
  SvgIcon,
  Typography,
  LinearProgress,
  AlertTitle,
  Paper,
  Skeleton,
  Link,
} from '@mui/material'
import * as Sentry from '@sentry/nextjs'
import React, { useState, useEffect, type ReactElement } from 'react'

import { useCurrentUser } from '@/components/providers/AuthProvider'
import { logger } from '@/lib/logger/client'

class SentryExampleFrontendError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleFrontendError'
  }
}

function SentryLogo(): ReactElement {
  return (
    <SvgIcon sx={{ fontSize: 40 }}>
      <path
        d="M21.85 2.995a3.698 3.698 0 0 1 1.353 1.354l16.303 28.278a3.703 3.703 0 0 1-1.354 5.053 3.694 3.694 0 0 1-1.848.496h-3.828a31.149 31.149 0 0 0 0-3.09h3.815a.61.61 0 0 0 .537-.917L20.523 5.893a.61.61 0 0 0-1.057 0l-3.739 6.494a28.948 28.948 0 0 1 9.63 10.453 28.988 28.988 0 0 1 3.499 13.78v1.542h-9.852v-1.544a19.106 19.106 0 0 0-2.182-8.85 19.08 19.08 0 0 0-6.032-6.829l-1.85 3.208a15.377 15.377 0 0 1 6.382 12.484v1.542H3.696A3.694 3.694 0 0 1 0 34.473c0-.648.17-1.286.494-1.849l2.33-4.074a8.562 8.562 0 0 1 2.689 1.536L3.158 34.17a.611.611 0 0 0 .538.917h8.448a12.481 12.481 0 0 0-6.037-9.09l-1.344-.772 4.908-8.545 1.344.77a22.16 22.16 0 0 1 7.705 7.444 22.193 22.193 0 0 1 3.316 10.193h3.699a25.892 25.892 0 0 0-3.811-12.033 25.856 25.856 0 0 0-9.046-8.796l-1.344-.772 5.269-9.136a3.698 3.698 0 0 1 3.2-1.849c.648 0 1.285.17 1.847.495Z"
        fill="currentColor"
      />
    </SvgIcon>
  )
}

export function SentryExampleView(): ReactElement {
  const { user: authUser } = useCurrentUser()
  const [hasSentError, setHasSentError] = useState(false)
  const [isConnected, setIsConnected] = useState(true)
  const [lastErrorTime, setLastErrorTime] = useState<number>(0)
  const [errorCount, setErrorCount] = useState(0)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [cooldownRemaining, setCooldownRemaining] = useState(0)

  const COOLDOWN_PERIOD = 30000 // 30 seconds
  const MAX_ERRORS_PER_SESSION = 5
  const isDevelopment = process.env.NODE_ENV === 'development'

  useEffect(() => {
    async function checkConnectivity(): Promise<void> {
      const result = await Sentry.diagnoseSdkConnectivity()
      setIsConnected(result !== 'sentry-unreachable')
    }
    checkConnectivity().catch(() => {
      logger.warn({ operation: 'checkConnectivity', module: 'sentry-example' }, 'Failed to check connectivity')
    })
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      const timeSinceLastError = Date.now() - lastErrorTime
      const remaining = Math.max(0, COOLDOWN_PERIOD - timeSinceLastError)
      setCooldownRemaining(remaining)
    }, 1000)

    return (): void => clearInterval(interval)
  }, [lastErrorTime])

  const handleThrowError = async (): Promise<void> => {
    const now = Date.now()
    const timeSinceLastError = now - lastErrorTime

    // Rate limiting protection
    if (timeSinceLastError < COOLDOWN_PERIOD) {
      return // Cooldown active
    }

    setShowConfirmDialog(true)
  }

  const confirmThrowError = async (): Promise<void> => {
    setShowConfirmDialog(false)

    try {
      await Sentry.startSpan(
        {
          name: 'Example Frontend/Backend Span',
          op: 'test',
        },
        async () => {
          const res = await fetch('/api/sentry-example-api')
          if (!res.ok) {
            setHasSentError(true)
          }
        }
      )

      setLastErrorTime(Date.now())
      setErrorCount((prev) => prev + 1)
      throw new SentryExampleFrontendError('This error is raised on the frontend of the example page.')
    } catch (error) {
      // Error will be caught by Sentry
      logger.error({ error }, 'Test error thrown')
    }
  }

  const canPushTheButton = isDevelopment && authUser && cooldownRemaining === 0 && errorCount < MAX_ERRORS_PER_SESSION
  const alertMsg =
    canPushTheButton === true
      ? 'You can now throw an error! Use with responsibility, please, do not abuse.'
      : cooldownRemaining > 0
        ? `Please wait ${Math.ceil(cooldownRemaining / 1000)} seconds before throwing another error.`
        : errorCount >= MAX_ERRORS_PER_SESSION
          ? 'Maximum error limit reached for this session.'
          : 'Please login to throw an error.'

  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <SentryLogo />

        <Typography variant="h4" component="h1" sx={{ fontFamily: 'monospace', m: 4 }}>
          sentry-example-page
        </Typography>

        {canPushTheButton === true ? (
          <Paper sx={{ textAlign: 'center', p: 4 }}>
            <Typography
              variant="body1"
              className="m-16"
              sx={{
                color: 'text.secondary',
              }}>
              Click the button below, and view the sample error on the Sentry{' '}
              <MuiLink
                href="https://mmerlones-org.sentry.io/issues/?project=4510199390863440"
                target="_blank"
                rel="noopener noreferrer">
                Issues Page
              </MuiLink>
              . For more details about setting up Sentry,{' '}
              <MuiLink
                href="https://docs.sentry.io/platforms/javascript/guides/nextjs/"
                target="_blank"
                rel="noopener noreferrer">
                read our docs
              </MuiLink>
              .
            </Typography>

            <Button
              variant="contained"
              size="large"
              onClick={handleThrowError}
              disabled={!canPushTheButton || hasSentError || !isConnected}
              sx={{
                textTransform: 'none',
                px: 4,
                py: 1.5,
                fontSize: '1.25rem',
                fontWeight: 'bold',
              }}>
              {cooldownRemaining > 0 ? `Wait ${Math.ceil(cooldownRemaining / 1000)}s` : 'Throw Sample Error'}
            </Button>

            {cooldownRemaining > 0 && (
              <Box sx={{ width: '100%', maxWidth: 300 }}>
                <LinearProgress
                  variant="determinate"
                  value={((COOLDOWN_PERIOD - cooldownRemaining) / COOLDOWN_PERIOD) * 100}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            <Alert
              severity={hasSentError ? 'success' : !isConnected ? 'error' : 'info'}
              variant={hasSentError || !isConnected ? 'filled' : 'outlined'}
              sx={{
                fontSize: hasSentError ? '1.25rem' : '1rem',
                py: hasSentError ? 1.5 : 1,
                px: hasSentError ? 2 : 1,
                maxWidth: hasSentError ? 'none' : '500px',
                mx: !hasSentError ? 'auto' : 'none',
                my: !hasSentError ? '2rem' : '1rem',
                textAlign: !hasSentError ? 'left' : 'center',
              }}>
              {hasSentError && (
                <>
                  Error sent to Sentry. ({errorCount}/{MAX_ERRORS_PER_SESSION} errors used this session)
                </>
              )}
              {!hasSentError && !isConnected && (
                <>
                  It looks like network requests to Sentry are being blocked, which will prevent errors from being
                  captured. Try disabling your ad-blocker to complete the test.
                </>
              )}
              {!hasSentError && isConnected && (
                <>
                  <AlertTitle>Info</AlertTitle>
                  {alertMsg}
                </>
              )}
            </Alert>
            <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)} maxWidth="sm" fullWidth>
              <DialogTitle>Confirm Error Submission</DialogTitle>
              <DialogContent>
                <Typography>
                  Are you sure you want to throw a test error? This will send an error to Sentry and count toward your
                  session limit.
                </Typography>
                <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
                  Errors used: {errorCount}/{MAX_ERRORS_PER_SESSION}
                </Typography>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setShowConfirmDialog(false)}>Cancel</Button>
                <Button onClick={confirmThrowError} variant="contained" color="error">
                  Throw Error
                </Button>
              </DialogActions>
            </Dialog>
          </Paper>
        ) : (
          <Box sx={{ py: 4 }}>
            <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />
            <Paper sx={{ p: 4 }}>
              <Skeleton variant="text" width="80%" height={20} sx={{ mx: 'auto', mb: 2 }} />
              <Skeleton variant="rectangular" width={200} height={50} sx={{ mx: 'auto', borderRadius: 1 }} />
            </Paper>
          </Box>
        )}
        <Typography variant="h6" component="h2" sx={{ m: 4, color: 'text.secondary' }}>
          <Link href="https://docs.sentry.io/product/" target="_blank" rel="noopener noreferrer">
            What is Sentry?
          </Link>
        </Typography>
        <Typography variant="body2" component="blockquote" color="text.secondary" sx={{ flexGrow: 1, m: 4 }}>
          Sentry is a software monitoring tool that helps developers identify and debug performance issues and errors.
          From end-to-end distributed tracing to performance monitoring, Sentry provides code-level observability that
          makes it easy to diagnose issues and learn continuously about your application code health across systems and
          services.
        </Typography>
      </Box>
    </Container>
  )
}
