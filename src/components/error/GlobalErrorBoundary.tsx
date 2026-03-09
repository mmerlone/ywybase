'use client'

import { ErrorOutline as ErrorIcon, Home as HomeIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { Alert, Box, Button, Container, Paper, Typography } from '@mui/material'
import { Component, type ReactNode, type ErrorInfo } from 'react'

import { ErrorCodes } from '@/lib/error/codes'
import { logger } from '@/lib/logger/client'
import type { AppError } from '@/types/error.types'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error | AppError
  errorInfo?: ErrorInfo
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error | AppError): State {
    return { hasError: true, error }
  }

  override componentDidCatch(error: Error | AppError, errorInfo: ErrorInfo): void {
    // Enhanced logging with structured error information
    // Create a base error context with common error information
    const errorContext = {
      error,
      errorInfo,
      componentStack: errorInfo.componentStack,
    }

    // Add AppError-specific properties if this is an AppError
    if (error !== null && error !== undefined && 'code' in error) {
      const appError = error
      Object.assign(errorContext, {
        errorCode: appError.code,
        errorContext: appError.context,
        statusCode: appError.statusCode,
        isOperational: appError.isOperational,
      })

      // Special handling for configuration errors
      if (appError.code === ErrorCodes.config.missingEnvVar()) {
        logger.error(
          {
            ...errorContext,
            setupUrl: 'https://supabase.com/dashboard/project/_/settings/api',
            documentation: 'https://supabase.com/docs/guides/api/api-keys',
          },
          'Configuration Error: Application cannot start'
        )
      } else {
        logger.error(errorContext, 'Global Error Boundary caught an error')
      }
    } else {
      logger.error(errorContext, 'Global Error Boundary caught an error')
    }

    this.setState({ error, errorInfo })

    // Capture error to Sentry for issue tracking
    if (typeof window !== 'undefined') {
      import('@sentry/nextjs')
        .then((Sentry) => {
          Sentry.withScope((scope) => {
            scope.setTag('errorBoundary', true)
            scope.setTag('component', 'GlobalErrorBoundary')
            scope.setContext('componentStack', {
              componentStack: errorInfo.componentStack,
            })
            Sentry.captureException(error)
          })
        })
        .catch((err) => {
          logger.error({ err }, 'Failed to load Sentry in Error Boundary')
        })
    }

    // Log error to monitoring service in production
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'production') {
      // Example: logErrorToService(error, errorInfo)
    }
  }

  // Helper method to check if error is AppError
  private isAppError(error: Error | AppError | undefined): error is AppError {
    return Boolean(error !== undefined && error !== null && 'code' in error && 'context' in error)
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleGoHome = (): void => {
    window.location.href = '/'
  }

  override render(): React.ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined && this.props.fallback !== null) {
        return this.props.fallback
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 2,
          }}>
          <Container maxWidth="md">
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <ErrorIcon color="error" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" component="h1" gutterBottom>
                Oops! Something went wrong
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                We&apos;re sorry, but something unexpected happened. Our team has been notified and is working to fix
                the issue.
              </Typography>

              {/* Show configuration error setup instructions */}
              {this.isAppError(this.state.error) &&
                this.state.error.code === ErrorCodes.config.missingEnvVar() &&
                process.env.NODE_ENV === 'development' && (
                  <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Quick Fix:
                    </Typography>
                    <Typography variant="body2" component="div">
                      1. Create <code>.env.local</code> from <code>.env.sample</code>
                      <br />
                      2. Add your Supabase credentials from{' '}
                      <a
                        href="https://supabase.com/dashboard/project/_/settings/api"
                        target="_blank"
                        rel="noopener noreferrer">
                        Supabase Dashboard
                      </a>
                      <br />
                      3. Restart the server
                    </Typography>
                  </Alert>
                )}

              {typeof process !== 'undefined' &&
                process.env?.NODE_ENV === 'development' &&
                this.state.error !== undefined && (
                  <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Error Details (Development Only):
                    </Typography>
                    <Typography variant="body2" component="pre" sx={{ fontSize: '0.75rem', overflow: 'auto' }}>
                      {this.state.error?.toString()}
                      {this.state.errorInfo?.componentStack}

                      {/* Show AppError-specific information */}
                      {this.isAppError(this.state.error) && (
                        <>
                          {`\n\n--- Structured Error Information ---`}
                          {`\nError Code: ${this.state.error.code}`}
                          {`\nStatus Code: ${this.state.error.statusCode}`}
                          {`\nIs Operational: ${this.state.error.isOperational}`}
                          {this.state.error.context !== undefined &&
                            `\nContext: ${JSON.stringify(this.state.error.context, null, 2)}`}
                        </>
                      )}
                    </Typography>
                  </Alert>
                )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
                  Go Home
                </Button>
              </Box>
            </Paper>
          </Container>
        </Box>
      )
    }

    return this.props.children
  }
}
