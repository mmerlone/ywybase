'use client'

import { Alert, Box, Button, CircularProgress, Link, Paper, Stack, Typography } from '@mui/material'
import { MarkEmailRead as EmailIcon } from '@mui/icons-material'
import { motion } from 'motion/react'
import { useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState, startTransition, useRef } from 'react'
import { FormProvider } from 'react-hook-form'

import { PasswordMeter } from '../PasswordMeter'

import { AuthFormFields } from './AuthFormFields'
import { AuthOperationSelector } from './AuthOperationSelector'
import { authFormDefaults } from './config/authFormDefaults'
import { uiText } from './config/uiText'
import { LoginButtons } from './LoginButtons'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { useAuthForm } from '@/hooks/useAuthForm'
import { SITE_CONFIG } from '@/config/site'
import { useRouter } from '@/lib/utils/navigation'
import {
  signUpWithEmail,
  forgotPassword,
  setPassword,
  updatePassword,
  resendVerification,
} from '@/lib/actions/auth/server'
import { handleError as handleError } from '@/lib/error/handlers/client.handler'
import {
  AuthOperationsEnum,
  type SerializableError,
  type FormTypeMap,
  type AuthOperations,
  type LoginFormInput,
  type SignUpFormInput,
  type ResetPasswordEmailFormInput,
  type ResetPasswordPassFormInput,
  type UpdatePasswordFormInput,
} from '@/types/auth.types'

const validOperations = Object.values(AuthOperationsEnum) as Array<keyof FormTypeMap>
type FormOperationType = keyof FormTypeMap

// Runtime guard to check if an operation is a valid form operation
function isFormOperation(operation: AuthOperations): operation is FormOperationType {
  return (validOperations as readonly string[]).includes(operation)
}

interface AuthFormProps {
  initialOperation?: AuthOperations
}

/**
 * TODO: Large AuthForm Component: 607 lines, consider splitting
 * Multiple useEffect Hooks: Could be optimized with custom hooks
 */

export default function AuthForm({ initialOperation = AuthOperationsEnum.LOGIN }: AuthFormProps): JSX.Element {
  const [error, setError] = useState<SerializableError | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null)
  const searchParams = useSearchParams()

  // Derive the current operation directly from the URL so there is a single
  // source of truth. `searchParams` → operation; no duplicated state.
  const operation = useMemo((): AuthOperations => {
    const op = searchParams.get('op')?.toLowerCase() ?? null
    return op && validOperations.includes(op as FormOperationType) ? (op as AuthOperations) : initialOperation
  }, [searchParams, initialOperation])
  // Track when we're transitioning between operations to prevent validation
  // from running on stale values during the morph animation
  const isTransitioning = useRef(false)
  // Track if the user has modified any form field - validation only runs after isDirty becomes true
  const isDirtyRef = useRef(false)

  // Use runtime guard to ensure operation is a valid form operation
  const formMethods = useAuthForm(
    isFormOperation(operation) ? operation : AuthOperationsEnum.LOGIN,
    isTransitioning,
    isDirtyRef
  )
  const { reset, clearErrors, formState } = formMethods
  // Use auth context for login to keep UI state in sync
  const { clearError, signIn } = useAuthContext()
  const router = useRouter()

  // Sync isDirtyRef with formState.isDirty to enable validation after user interaction
  useEffect(() => {
    isDirtyRef.current = formState.isDirty
  }, [formState.isDirty])

  // Handle resend cooldown timer
  useEffect(() => {
    // Clear any existing cooldown timer
    if (cooldownTimerRef.current) {
      clearInterval(cooldownTimerRef.current)
      cooldownTimerRef.current = null
    }

    // Set new timer if cooldown is active
    if (resendCooldown > 0) {
      cooldownTimerRef.current = setInterval(() => {
        setResendCooldown((prev) => prev - 1)
      }, 1000)
    }

    // Cleanup function
    return (): void => {
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
    }
  }, [resendCooldown])

  // Comprehensive cleanup on component unmount
  useEffect(() => {
    return (): void => {
      // Clear all timers on unmount
      if (cooldownTimerRef.current) {
        clearInterval(cooldownTimerRef.current)
        cooldownTimerRef.current = null
      }
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current)
        transitionTimerRef.current = null
      }
    }
  }, [])

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

  // Track the previous operation so the effect below can detect real changes
  // and skip the no-op on initial mount.
  const prevOperationRef = useRef(operation)

  // React to operation changes: clear stale form state, reset to new defaults,
  // and guard validation during the morph animation.
  // All deps are explicit — `clearErrors` and `reset` are stable refs from RHF.
  useEffect((): void => {
    if (operation === prevOperationRef.current) return
    prevOperationRef.current = operation

    // Mark transitioning to prevent validation from running on stale values
    // during the morph animation.
    isTransitioning.current = true

    // Clear stale validation errors before the operation switches.
    clearErrors()

    // Batch non-form state resets.
    startTransition(() => {
      setError(null)
      setEmailSent(false)
    })

    // Reset form to the defaults of the incoming operation.
    const newConfig = isFormOperation(operation)
      ? authFormDefaults[operation]
      : authFormDefaults[AuthOperationsEnum.LOGIN]
    reset(newConfig, {
      keepErrors: false,
      keepDirty: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
    })

    // Re-enable validation after the browser has finished processing field
    // blur/change events from the DOM transition.
    if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current)
    transitionTimerRef.current = setTimeout(() => {
      isTransitioning.current = false
      transitionTimerRef.current = null
    }, 50)
  }, [operation, clearErrors, reset])

  const handleOperationChange = useCallback(
    (newOperation: AuthOperations): void => {
      // Update URL using custom router with RouteKey and query params
      router.push('AUTH', undefined, { op: newOperation })
    },
    [router]
  )

  const getErrorMessage = (err: SerializableError): string => {
    switch (err.code) {
      case 'AUTH/INVALID_CREDENTIALS':
        return uiText.errors.invalidCredentials
      case 'AUTH/EMAIL_ALREADY_IN_USE':
        return uiText.errors.emailAlreadyInUse
      case 'AUTH/EMAIL_NOT_CONFIRMED':
        return uiText.errors.emailNotConfirmed
      default:
        return err.message
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
          const result = await signIn(email, password)

          if (result.error) {
            setError(result.error)
            return
          }
          setIsRedirecting(true)
          router.push('PROFILE')
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
            setError(errorObj ?? null)
            return
          }

          // Show success message and switch to login
          setSuccessMessage(uiText.success.accountCreatedDescription)
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
            setError(errorObj ?? null)
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
            setError(errorObj ?? null)
            return
          }

          // Show success message before redirecting
          setSuccessMessage(result.message ?? 'Password reset completed successfully')
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
            setError(errorObj ?? null)
            return
          }
          setIsRedirecting(true)
          router.push('PROFILE')
          break
        }
        case AuthOperationsEnum.RESEND_VERIFICATION: {
          const { email } = data as ResetPasswordEmailFormInput
          const result = await resendVerification(email)

          if (!result.success) {
            const errorObj =
              typeof result.error === 'string'
                ? handleError(new Error(result.error), { operation: AuthOperationsEnum.RESEND_VERIFICATION })
                : result.error
            setError(errorObj ?? null)
            return
          }
          setEmailSent(true)
          setResendCooldown(SITE_CONFIG.auth.resendVerificationCooldown)
          break
        }
      }
    } catch (err) {
      // Handle any unexpected errors with structured error handling
      const unexpectedError = handleError(err, {
        operation,
        originalError: err,
      })
      setError(unexpectedError)
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}>
        <Paper
          elevation={4}
          sx={{
            maxWidth: 500,
            mx: 'auto',
            p: { xs: 4, md: 6 },
            textAlign: 'center',
            bgcolor: 'background.paper',
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              borderRadius: '50%',
              bgcolor: 'primary.light',
              color: 'primary.main',
              mb: 3,
              opacity: 0.9,
            }}>
            <EmailIcon sx={{ fontSize: 48 }} />
          </Box>
          <Typography variant="h5" component="h2" gutterBottom fontWeight={700} color="text.primary">
            {uiText.success.emailSent}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6 }}>
            {uiText.success.emailSentDescription}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            size="large"
            fullWidth
            onClick={() => {
              setEmailSent(false)
              handleOperationChange(AuthOperationsEnum.LOGIN)
            }}
            sx={{
              py: 1.5,
              fontWeight: 600,
              borderRadius: 2,
              boxShadow: 'none',
              '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.1)' },
            }}>
            {uiText.links.backToSignIn}
          </Button>
        </Paper>
      </motion.div>
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
                  onClick={() => router.push('PROFILE')}
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
                  disabled={isLoading || isSocialLoading}
                />
              </Box>
            )}
            <Stack
              spacing={3}
              component={motion.div}
              layout
              sx={{ flex: 1, minWidth: 0 }}
              transition={{ layout: { duration: 0.28, ease: [0.2, 0, 0.2, 1] } }}>
              <AuthFormFields operation={operation} isLoading={isLoading || isSocialLoading} />

              {operation !== AuthOperationsEnum.FORGOT_PASSWORD &&
                operation !== AuthOperationsEnum.LOGIN &&
                operation !== AuthOperationsEnum.RESEND_VERIFICATION && (
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
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.RESEND_VERIFICATION)}
                    disabled={isLoading || isSocialLoading}
                    sx={{ textTransform: 'none' }}>
                    Resend verification email
                  </Button>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.FORGOT_PASSWORD)}
                    disabled={isLoading || isSocialLoading}
                    sx={{ textTransform: 'none' }}>
                    Forgot password
                  </Button>
                </Box>
              )}
              {(operation === AuthOperationsEnum.UPDATE_PASSWORD ||
                operation === AuthOperationsEnum.FORGOT_PASSWORD ||
                operation === AuthOperationsEnum.RESEND_VERIFICATION) && (
                <Box sx={{ mb: 2, mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => handleOperationChange(AuthOperationsEnum.LOGIN)}
                    disabled={isLoading || isSocialLoading}
                    sx={{ textTransform: 'none' }}>
                    Back to login
                  </Button>
                </Box>
              )}

              <Button
                type="submit"
                fullWidth
                variant="contained"
                // Avoid reading `formState.isValid` on initial mount because that
                // causes the zod resolver to run immediately and throw when defaults
                // are invalid. Only consider `isValid` after the user has interacted
                // with the form (`isDirty`). This keeps the submit button disabled
                // until the user makes changes without triggering validation on mount.
                disabled={
                  (formMethods.formState.isDirty ? !formMethods.formState.isValid : true) ||
                  isLoading ||
                  isSocialLoading ||
                  isRedirecting ||
                  (operation === AuthOperationsEnum.RESEND_VERIFICATION && resendCooldown > 0)
                }
                sx={{ mt: 2, mb: 2 }}>
                {isLoading || isRedirecting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : operation === AuthOperationsEnum.RESEND_VERIFICATION && resendCooldown > 0 ? (
                  `Resend in ${resendCooldown}s`
                ) : (
                  uiText.buttons[operation]
                )}
              </Button>

              {operation === AuthOperationsEnum.SIGN_UP && (
                <Typography
                  variant="caption"
                  align="center"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1, lineHeight: 1.5 }}>
                  By creating an account, you agree to our{' '}
                  <Link href="/terms" underline="hover" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" underline="hover" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Privacy Policy
                  </Link>
                  .
                </Typography>
              )}
            </Stack>
          </form>
          {(operation === AuthOperationsEnum.LOGIN || operation === AuthOperationsEnum.SIGN_UP) && (
            <Paper
              sx={{
                width: '100%',
                maxWidth: '400px',
                p: 2,
                mt: 2,
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
                <LoginButtons
                  disabled={isLoading || isRedirecting}
                  onError={setError}
                  onLoadingChange={setIsSocialLoading}
                />
              </Stack>
            </Paper>
          )}
        </Stack>
      </FormProvider>
    </Paper>
  )
}
