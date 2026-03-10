'use client'

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  Divider,
  IconButton,
  InputAdornment,
} from '@mui/material'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import DeleteIcon from '@mui/icons-material/Delete'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { FormProvider, useForm } from 'react-hook-form'
import React, { useState, type ReactElement } from 'react'

import { AuthFormFields } from '../auth/AuthForm/AuthFormFields'
import { PasswordMeter } from '@/components/auth/PasswordMeter'
import { updatePassword, addPassword } from '@/lib/actions/auth/server'
import { authService } from '@/lib/actions/auth/client'
import { downloadPersonalData, deleteAccount } from '@/lib/actions/account'
import {
  type UpdatePasswordFormInput,
  updatePasswordSchema,
  type AddPasswordFormInput,
  addPasswordSchema,
} from '@/lib/validators/auth'
import { createSafeResolver } from '@/lib/utils/forms'
import { AuthOperationsEnum } from '@/types/auth.types'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { logger } from '@/lib/logger/client'
import { useRouter } from 'next/navigation'
import { useAuthContext, useCurrentUser } from '@/components/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'

type PasswordFormInput = AddPasswordFormInput & { password: string; confirmPassword: string }

export function TabAccount(): ReactElement {
  const { user: authUser } = useCurrentUser()
  const { signOut, refreshSession } = useAuthContext()
  const { showError, showSuccess } = useSnackbar()
  const router = useRouter()
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteInput, setDeleteInput] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [isAddPasswordValid, setIsAddPasswordValid] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  const { profile } = useProfile(authUser?.id)

  // Determine if user has a password-based identity
  // If they have an 'email' provider identity in their profile, they must use a password
  const hasPassword = profile?.providers?.includes('email') ?? false

  // For OAuth users without password, they must type this confirmation phrase
  const deleteConfirmationPhrase = `DELETE MY ACCOUNT ${authUser?.email ?? ''}`

  const form = useForm<UpdatePasswordFormInput>({
    resolver: createSafeResolver(updatePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { handleSubmit, formState, reset, watch } = form
  const { isSubmitting } = formState

  // Form for adding a password (OAuth users)
  const addPasswordForm = useForm<PasswordFormInput>({
    resolver: createSafeResolver(addPasswordSchema),
    mode: 'onChange',
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  })

  const {
    handleSubmit: handleAddPasswordSubmit,
    formState: addPasswordFormState,
    reset: resetAddPassword,
    watch: watchAddPassword,
  } = addPasswordForm
  const { isSubmitting: isAddPasswordSubmitting } = addPasswordFormState

  const handleChangePassword = async (data: UpdatePasswordFormInput): Promise<void> => {
    try {
      const result = await updatePassword(data)

      if (result.success) {
        showSuccess('Password updated successfully!')
        reset()
        setIsPasswordValid(false)
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : (result.error?.message ?? 'Failed to update password')
        showError(errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update password'
      logger.error(
        {
          error: errorMessage,
          component: 'TabAccount',
          action: 'updatePassword',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Password update error'
      )
      showError('Failed to update password. Please try again.')
    }
  }

  const handleAddPassword = async (data: PasswordFormInput): Promise<void> => {
    try {
      const result = await addPassword(data)

      if (result.success) {
        showSuccess('Password added! You can now sign in with email and password.')
        resetAddPassword()
        setIsAddPasswordValid(false)

        // Force a network refresh of the local session to get the new email identity claims set by the server
        await authService.refreshSession()

        // Refresh session to update React context (hasPassword will become true)
        await refreshSession()
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : (result.error?.message ?? 'Failed to add password')
        showError(errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add password'
      logger.error(
        {
          error: errorMessage,
          component: 'TabAccount',
          action: 'addPassword',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Add password error'
      )
      showError('Failed to add password. Please try again.')
    }
  }

  const handleDownloadPersonalData = async (): Promise<void> => {
    setDownloadLoading(true)
    try {
      const result = await downloadPersonalData()

      if (result.success && result.data) {
        // Create a blob and trigger download
        const blob = new Blob([result.data], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `personal-data-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        showSuccess('Personal data downloaded successfully!')
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : (result.error?.message ?? 'Failed to download data')
        showError(errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to download personal data'
      logger.error(
        {
          error: errorMessage,
          component: 'TabAccount',
          action: 'downloadPersonalData',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Personal data download error'
      )
      showError('Failed to download personal data. Please try again.')
    } finally {
      setDownloadLoading(false)
    }
  }

  const handleDeleteAccount = async (): Promise<void> => {
    if (hasPassword && !deleteInput) {
      showError('Password is required to delete your account')
      return
    }

    if (!hasPassword && deleteInput !== deleteConfirmationPhrase) {
      showError('Please type the exact confirmation phrase')
      return
    }

    setDeleteLoading(true)
    try {
      // If user has password, deleteInput is the password
      // If not (OAuth), we pass undefined as password is not required/checked
      const result = await deleteAccount(hasPassword ? deleteInput : undefined)

      if (result.success) {
        // Clear client-side session immediately
        await signOut()
        showSuccess('Account deleted successfully. Redirecting...')
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        const errorMessage =
          typeof result.error === 'string' ? result.error : (result.error?.message ?? 'Failed to delete account')
        showError(errorMessage)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete account'
      logger.error(
        {
          error: errorMessage,
          component: 'TabAccount',
          action: 'deleteAccount',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Account deletion error'
      )
      showError('Failed to delete account. Please try again.')
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
      setDeleteInput('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {hasPassword ? (
        <>
          {/* Change Password Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LockOutlinedIcon />
              <Typography variant="h6">Change Password</Typography>
            </Box>
            <FormProvider {...form}>
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSubmit(handleChangePassword)(e).catch(() => {})
                }}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <AuthFormFields operation={AuthOperationsEnum.UPDATE_PASSWORD} isLoading={isSubmitting} />

                <PasswordMeter
                  password={watch('newPassword') ?? ''}
                  confirmPassword={watch('confirmPassword') ?? ''}
                  onValidationChange={setIsPasswordValid}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isSubmitting || !isPasswordValid}
                  sx={{ alignSelf: 'flex-start' }}>
                  {isSubmitting ? 'Updating...' : 'Update Password'}
                </Button>
              </Box>
            </FormProvider>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
              For security reasons, make sure to log out from other devices if you suspect any unauthorized access to
              your account.
            </Typography>
          </Box>
        </>
      ) : (
        <>
          {/* Add Password Section (for OAuth-only users) */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LockOutlinedIcon />
              <Typography variant="h6">Add Password</Typography>
            </Box>
            <Typography variant="body2">
              You signed up using a social account. Add a password to also sign in with your email and password.
            </Typography>
            <FormProvider {...addPasswordForm}>
              <Box
                component="form"
                onSubmit={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAddPasswordSubmit(handleAddPassword)(e).catch(() => {})
                }}
                noValidate
                sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <AuthFormFields operation={AuthOperationsEnum.ADD_PASSWORD} isLoading={isAddPasswordSubmitting} />

                <PasswordMeter
                  password={watchAddPassword('password') ?? ''}
                  confirmPassword={watchAddPassword('confirmPassword') ?? ''}
                  onValidationChange={setIsAddPasswordValid}
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={isAddPasswordSubmitting || !isAddPasswordValid}
                  sx={{ alignSelf: 'flex-start' }}>
                  {isAddPasswordSubmitting ? 'Setting Password...' : 'Set Password'}
                </Button>
              </Box>
            </FormProvider>
          </Box>
        </>
      )}

      <Divider />

      {/* Download Personal Data Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <DownloadIcon />
          <Typography variant="h6">Download Personal Data</Typography>
        </Box>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Download all your personal data including profile information and account details in JSON format. This export
          can be used for backup purposes or to transfer your data.
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={downloadLoading ? <CircularProgress size={20} color="inherit" /> : <DownloadIcon />}
          disabled={downloadLoading}
          onClick={handleDownloadPersonalData}>
          {downloadLoading ? 'Downloading...' : 'Download My Data'}
        </Button>
      </Box>

      <Divider />

      {/* Delete Account Section */}
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <DeleteIcon />
          <Typography variant="h6" sx={{ color: 'error.main' }}>
            Delete Account
          </Typography>
        </Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
            This action cannot be undone!
          </Typography>
          <Typography variant="body2">
            Deleting your account will permanently remove all your data from our servers, including your profile,
            settings, and any associated information.
          </Typography>
        </Alert>
        <Button variant="contained" color="error" startIcon={<DeleteIcon />} onClick={() => setDeleteDialogOpen(true)}>
          Delete My Account
        </Button>
      </Box>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleteLoading && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle sx={{ fontWeight: 600, color: 'error.main' }}>Confirm Account Deletion</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Alert severity="warning" sx={{ mb: 2 }}>
            This action is permanent and cannot be reversed.
          </Alert>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {hasPassword
              ? 'To confirm account deletion, please enter your password:'
              : `To confirm, please type exactly: "${deleteConfirmationPhrase}"`}
          </Typography>
          <TextField
            fullWidth
            type={hasPassword && !showDeletePassword ? 'password' : 'text'}
            label={hasPassword ? 'Password' : 'Confirmation Phrase'}
            value={deleteInput}
            onChange={(e) => setDeleteInput(e.target.value)}
            disabled={deleteLoading}
            placeholder={hasPassword ? 'Enter your password to confirm' : deleteConfirmationPhrase}
            slotProps={{
              input: {
                endAdornment: hasPassword ? (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      onMouseDown={(e) => e.preventDefault()}
                      edge="end"
                      disabled={deleteLoading}>
                      {showDeletePassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deleteLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteAccount}
            disabled={!deleteInput || deleteLoading || (!hasPassword && deleteInput !== deleteConfirmationPhrase)}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}>
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
