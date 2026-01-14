'use client'

import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { motion } from 'motion/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState, startTransition } from 'react'
import { FormProvider } from 'react-hook-form'

import { PasswordMeter } from '../PasswordMeter'

import { AuthFormFields } from './AuthFormFields'
import { AuthOperationSelector } from './AuthOperationSelector'
import { authFormDefaults } from './config/authFormDefaults'
import { uiText } from './config/uiText'
import { LoginButtons } from './LoginButtons'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAuthForm } from '@/hooks/useAuthForm'
import { loginWithEmail, signUpWithEmail, forgotPassword, setPassword, updatePassword } from '@/lib/actions/auth/server'
import { handleClientError as handleError } from '@/lib/error'
import type { SerializableError } from '@/types/auth.types'
import type { FormTypeMap, AuthOperations } from '@/types/auth.types'
import {
  LoginFormInput,
  SignUpFormInput,
  ResetPasswordEmailFormInput,
  ResetPasswordPassFormInput,
  UpdatePasswordFormInput,
} from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/auth.types'

const validOperations = Object.values(AuthOperationsEnum) as Array<keyof FormTypeMap>
type FormOperationType = keyof FormTypeMap

// Runtime guard to check if an operation is a valid form operation
function isFormOperation(operation: AuthOperations): operation is FormOperationType {
  return (validOperations as readonly string[]).includes(operation)
}

interface AuthFormProps {
  initialOperation?: AuthOperations
}

export default function AuthForm({ initialOperation = AuthOperationsEnum.LOGIN }: AuthFormProps): JSX.Element {
  const [operation, setOperation] = useState<AuthOperations>(initialOperation)
  const [error, setError] = useState<SerializableError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const searchParams = useSearchParams()
  // Use runtime guard to ensure operation is a valid form operation
  const formMethods = useAuthForm(isFormOperation(operation) ? operation : AuthOperationsEnum.LOGIN)
  const { reset } = formMethods
  // All operations are handled by server actions, only need clearError from context
  const { clearError } = useAuthContext()
  const router = useRouter()

  useEffect(() => {
    const checkSignOutReason = (): void => {
      const signOutReason = document.cookie
        .split('; ')
        .find((row) => row.startsWith('signout-reason='))
        ?.split('=')[1]

      switch (signOutReason) {
        case 'user-not-found': {
          const userNotFoundError = handleError(new Error('User not found'), {
            operation: 'authCheck',
            originalError: new Error(`Sign out reason: ${signOutReason}`),
          })
          setError(userNotFoundError)

          // Remove the cookie
          document.cookie = 'signout-reason=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          break
        }
      }
    }

    checkSignOutReason()
  }, [searchParams, router])

  // Handle operation changes and form reset
  useEffect((): void => {
    const op = searchParams.get('op')?.toLowerCase() ?? null
    const newOperation =
      op && validOperations.includes(op as FormOperationType) ? (op as AuthOperations) : AuthOperationsEnum.LOGIN

    if (newOperation !== operation) {
      // Batch state updates with startTransition for better performance
      startTransition(() => {
        setOperation(newOperation)
        setError(null)
        setEmailSent(false)
      })

      // Use runtime guard to ensure newOperation is a valid form operation
      const newConfig = isFormOperation(newOperation)
        ? authFormDefaults[newOperation]
        : authFormDefaults[AuthOperationsEnum.LOGIN]
      reset(newConfig)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset is stable from react-hook-form
  }, [searchParams, operation])

  const handleOperationChange = useCallback(
    (newOperation: AuthOperations): void => {
      // Update the URL using Next.js router so useSearchParams reacts
      const url = new URL(window.location.href)
      url.searchParams.set('op', newOperation)
      router.replace(`${url.pathname}${url.search}${url.hash}`)
    },
    [router]
  )

  const getErrorMessage = (error: SerializableError): string => {
    switch (error.code) {
      case 'AUTH/INVALID_CREDENTIALS':
        return 'Invalid email or password. Please check your credentials and try again.'
      case 'AUTH/EMAIL_ALREADY_IN_USE':
        return 'This email is already in use. Please login instead.'
      case 'AUTH/EMAIL_NOT_CONFIRMED':
        return 'Please verify your email address before logging in. Check your inbox for the confirmation link.'
      default:
        return error.message
    }
  }

  const handleFormSubmit = async (
    data:
      | LoginFormInput
      | SignUpFormInput
      | ResetPasswordEmailFormInput
      | ResetPasswordPassFormInput
      | UpdatePasswordFormInput
  ): Promise<void> => {
    try {
      setIsLoading(true)
      setIsRedirecting(false)
      setError(null)

      setSuccessMessage(null) // Clear success message when submitting a form
      clearError() // Clear any auth context errors

      switch (operation) {
        case AuthOperationsEnum.LOGIN: {
          const { email, password } = data as LoginFormInput
          const result = await loginWithEmail({ email, password })

          if (!result.success) {
            // Use the serialized error from the server directly
            if (typeof result.error === 'string') {
              // Fallback for string errors
              const appError = handleError(new Error(result.error), {
                operation: AuthOperationsEnum.LOGIN,
                code: 'AUTH/UNKNOWN',
              })
              setError(appError)
            } else {
              // Use the serialized AppErrorJSON from server
              setError(result.error || null)
            }
            return
          }
          setIsRedirecting(true)
          router.push('/profile')
          break
        }
        case AuthOperationsEnum.SIGN_UP: {
          const { email, password, name, acceptTerms } = data as SignUpFormInput
          const result = await signUpWithEmail({ email, password, name, confirmPassword: password, acceptTerms })

          if (!result.success) {
            // Use the serialized error from the server
            const errorObj =
              typeof result.error === 'string'
                ? handleError(new Error(result.error), { operation: 'signup', code: 'AUTH/UNKNOWN' })
                : result.error

            // Check if error code suggests switching to login
            if (errorObj?.code === 'AUTH/EMAIL_ALREADY_IN_USE') {
              handleOperationChange(AuthOperationsEnum.LOGIN)
              return
            }
            setError(errorObj || null)
            return
          }

          // Show success message and switch to login
          setSuccessMessage('Account created! Please check your email to verify your account.')
          handleOperationChange(AuthOperationsEnum.LOGIN)
          break
        }
        case AuthOperationsEnum.FORGOT_PASSWORD: {
          const { email } = data as ResetPasswordEmailFormInput
          const result = await forgotPassword({ email })

          if (!result.success) {
            // Use the serialized error from the server
            const errorObj =
              typeof result.error === 'string'
                ? handleError(new Error(result.error), { operation: 'resetPassword' })
                : result.error
            setError(errorObj || null)
            return
          }
          setEmailSent(true)
          break
        }
        case AuthOperationsEnum.SET_PASSWORD: {
          // This case happens when user clicks password reset link from email and lands on page with token
          // The form collects new password. The user is authenticated via the reset token.
          const { password, confirmPassword } = data as ResetPasswordPassFormInput
          const result = await setPassword({ password, confirmPassword })

          if (!result.success) {
            // Use the serialized error from the server
            const errorObj =
              typeof result.error === 'string'
                ? handleError(new Error(result.error), { operation: AuthOperationsEnum.SET_PASSWORD })
                : result.error
            setError(errorObj || null)
            return
          }

          // Show success message before redirecting
          setSuccessMessage(result.message || 'Password reset completed successfully')
          reset()
          break
        }
        case AuthOperationsEnum.UPDATE_PASSWORD: {
          const { currentPassword, newPassword, confirmPassword } = data as UpdatePasswordFormInput
          const result = await updatePassword({ currentPassword, newPassword, confirmPassword })

          if (!result.success) {
            // Use the serialized error from the server
            const errorObj =
              typeof result.error === 'string'
                ? handleError(new Error(result.error), { operation: 'updatePassword' })
                : result.error
            setError(errorObj || null)
            return
          }
          setIsRedirecting(true)
          router.push('/profile')
          break
        }
      }
    } catch (error) {
      // Handle any unexpected errors with structured error handling
      const unexpectedError = handleError(error, {
        operation,
        originalError: error,
      })
      setError(unexpectedError)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Paper
        elevation={3}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 4,
          textAlign: 'center',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 'var(--mui-shadows-4)',
        }}>
        <Typography variant="h6" component="h2" gutterBottom color="text.primary">
          Check your email
        </Typography>
        <Typography variant="body1" color="text.secondary">
          We&apos;ve sent you a password reset link. Please check your email.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          fullWidth
          onClick={() => {
            setEmailSent(false)
            handleOperationChange(AuthOperationsEnum.LOGIN)
          }}
          sx={{ mt: 2 }}>
          Back to Login
        </Button>
      </Paper>
    )
  }

  return (
    <Paper
      sx={{
        width: '100%',
        mx: 'auto',
        p: 4,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 'var(--mui-shadows-4)',
      }}>
      <FormProvider {...formMethods}>
        <Typography
          variant="h5"
          component="h1"
          align="center"
          gutterBottom
          color="text.primary"
          sx={{ fontWeight: 600 }}>
          {uiText.titles[operation]}
        </Typography>
        {successMessage && (
          <Alert
            severity="success"
            elevation={2}
            action={
              operation === AuthOperationsEnum.SET_PASSWORD ? (
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => router.push('/profile')}
                  sx={{
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    minWidth: 'auto',
                  }}>
                  Go to Profile
                </Button>
              ) : (
                <Button
                  size="small"
                  color="inherit"
                  onClick={() => setSuccessMessage(null)}
                  sx={{ textTransform: 'none' }}>
                  Dismiss
                </Button>
              )
            }
            sx={{
              mt: 1,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'left',
              },
            }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {successMessage}
              </Typography>
            </Box>
          </Alert>
        )}
        {error && (
          <Alert
            severity="error"
            elevation={2}
            action={
              <Button
                size="small"
                color="inherit"
                onClick={() => {
                  setError(null)
                  clearError()
                }}
                sx={{ textTransform: 'none' }}>
                Dismiss
              </Button>
            }
            sx={{
              mt: 1,
              '& .MuiAlert-message': {
                width: '100%',
                textAlign: 'left',
              },
            }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {getErrorMessage(error)}
              </Typography>
            </Box>
          </Alert>
        )}
        <Stack direction="row" spacing={8} justifyContent="space-between" alignItems="start" mb={2}>
          <form onSubmit={formMethods.handleSubmit(handleFormSubmit)} style={{ width: '100%' }}>
            {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.SIGN_UP) && (
              <Box sx={{ mb: 3, mt: 2, width: '100%' }}>
                <AuthOperationSelector
                  currentOperation={operation}
                  onOperationChange={handleOperationChange}
                  disabled={isLoading}
                />
              </Box>
            )}
            <Stack
              spacing={3}
              component={motion.div}
              layout
              sx={{ flex: 1, minWidth: 0 }}
              transition={{ layout: { duration: 0.28, ease: [0.2, 0, 0.2, 1] } }}>
              <AuthFormFields operation={operation} isLoading={isLoading} />

              {operation !== AuthOperationsEnum.FORGOT_PASSWORD && operation !== AuthOperationsEnum.LOGIN && (
                <motion.div layout>
                  {operation === AuthOperationsEnum.UPDATE_PASSWORD ? (
                    <PasswordMeter
                      password={formMethods.watch('newPassword')}
                      confirmPassword={formMethods.watch('confirmPassword')}
                    />
                  ) : (
                    <PasswordMeter
                      password={formMethods.watch('password')}
                      confirmPassword={formMethods.watch('confirmPassword')}
                    />
                  )}
                </motion.div>
              )}

              {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.SIGN_UP) && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.FORGOT_PASSWORD)}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}>
                    Forgot password
                  </Button>
                </Box>
              )}
              {(operation === AuthOperationsEnum.UPDATE_PASSWORD ||
                operation === AuthOperationsEnum.FORGOT_PASSWORD) && (
                <Box sx={{ mb: 2, mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.LOGIN)}
                    disabled={isLoading}
                    sx={{ textTransform: 'none' }}>
                    Back to login
                  </Button>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={!formMethods.formState.isValid || isLoading || isRedirecting}
                sx={{ mt: 2, mb: 2 }}>
                {isLoading || isRedirecting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  uiText.buttons[operation]
                )}
              </Button>
            </Stack>
          </form>
          {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.SIGN_UP) && (
            <Paper
              sx={{
                width: '100%',
                maxWidth: '400px',
                p: 2,
                mt: 2,
                // padding: '16px',
              }}>
              <Stack sx={{ width: '100%' }}>
                <Typography
                  variant="h6"
                  component="h1"
                  align="center"
                  gutterBottom
                  color="text.primary"
                  sx={{ fontWeight: 600 }}>
                  OR
                </Typography>
                <LoginButtons disabled={isLoading} />
              </Stack>
            </Paper>
          )}
        </Stack>
      </FormProvider>
    </Paper>
  )
}
