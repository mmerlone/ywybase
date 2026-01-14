'use client'

import { Alert, Button, CircularProgress } from '@mui/material'
import { useEffect, useActionState } from 'react'

import { resendVerification, checkVerificationStatus } from '@/lib/actions/auth/server'
import type { AuthResponse } from '@/types/error.types'
import { VerificationStatusType } from '@/types/auth.types'
import { VerificationStatusEnum } from '@/types/auth.types'

type VerificationStatusProps = {
  userId: string
}

export function VerificationStatus({ userId }: VerificationStatusProps): JSX.Element | null {
  // Check verification status state
  const [checkState, checkFormAction, isPending] = useActionState(
    async (_prevState: AuthResponse, formData: FormData) => {
      return checkVerificationStatus(formData)
    },
    {
      success: false,
      error: undefined,
      message: '',
      pending: false,
      data: { verified: false },
    } as AuthResponse<{ verified: boolean }>,
    '/auth/verify' // permalink for verification action
  )

  // Resend verification state
  const [resendState, resendFormAction, isResendPending] = useActionState(
    async () => {
      return resendVerification()
    },
    {
      success: false,
      error: undefined,
      message: '',
      pending: false,
    } as AuthResponse<void>,
    '/auth/resend-verification' // permalink for resend action
  )

  // Determine current status from check state
  const getStatus = (pending: boolean): VerificationStatusType => {
    if (pending) return VerificationStatusEnum.CHECKING
    const data = checkState.data as { verified: boolean } | undefined
    if (checkState.success && data?.verified) return VerificationStatusEnum.VERIFIED
    if (checkState.success && !data?.verified) return VerificationStatusEnum.UNVERIFIED
    return VerificationStatusEnum.IDLE
  }

  const status = getStatus(isPending)

  // Auto-check verification status on mount and periodically
  useEffect(() => {
    const checkStatus = (): void => {
      const formData = new FormData()
      formData.append('userId', userId)
      checkFormAction(formData)
    }

    // Initial check
    checkStatus()

    // Check every 30 seconds
    const interval = setInterval(checkStatus, 30000)
    return (): void => clearInterval(interval)
  }, [userId, checkFormAction])

  // Don't show anything if email is verified
  if (status === VerificationStatusEnum.VERIFIED) {
    return null
  }

  // Show loading state while checking verification status
  if (isPending) {
    return (
      <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
        Verifying your email status...
      </Alert>
    )
  }

  // Show verification banner for unverified/idle states
  return (
    <>
      <Alert
        severity="warning"
        action={
          <form action={resendFormAction}>
            <Button type="submit" color="inherit" size="small" disabled={isResendPending}>
              {isResendPending ? <CircularProgress size={20} /> : 'Resend Email'}
            </Button>
          </form>
        }
        sx={{ mb: 2 }}>
        Please verify your email address to access all features.
      </Alert>

      {checkState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof checkState.error === 'string'
            ? checkState.error
            : 'Failed to check verification status. Please try again.'}
        </Alert>
      )}

      {resendState.error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {typeof resendState.error === 'string'
            ? resendState.error
            : 'Failed to send verification email. Please try again.'}
        </Alert>
      )}

      {resendState.success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {resendState.message || 'Verification email sent. Please check your inbox.'}
        </Alert>
      )}
    </>
  )
}
