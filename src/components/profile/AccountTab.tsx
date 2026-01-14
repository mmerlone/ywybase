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
import { zodResolver } from '@hookform/resolvers/zod'
import { FormProvider, useForm } from 'react-hook-form'
import { useState } from 'react'

import { AuthFormFields } from '../auth/AuthForm/AuthFormFields'
import { PasswordMeter } from '@/components/auth/PasswordMeter'
import { updatePassword } from '@/lib/actions/auth/server'
import { downloadPersonalData, deleteAccount } from '@/lib/actions/account'
import { UpdatePasswordFormInput, updatePasswordSchema } from '@/lib/validators'
import { AuthOperationsEnum } from '@/types/auth.types'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { logger } from '@/lib/logger/client'
import { useRouter } from 'next/navigation'

export function AccountTab(): JSX.Element {
  const { showError, showSuccess } = useSnackbar()
  const router = useRouter()
  const [downloadLoading, setDownloadLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [isPasswordValid, setIsPasswordValid] = useState(false)
  const [showDeletePassword, setShowDeletePassword] = useState(false)

  const form = useForm<UpdatePasswordFormInput>({
    resolver: zodResolver(updatePasswordSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const { handleSubmit, formState, reset, watch } = form
  const { isSubmitting } = formState

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
          component: 'AccountTab',
          action: 'updatePassword',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Password update error'
      )
      showError('Failed to update password. Please try again.')
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
          component: 'AccountTab',
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
    if (!deletePassword) {
      showError('Password is required to delete your account')
      return
    }

    setDeleteLoading(true)
    try {
      const result = await deleteAccount(deletePassword)

      if (result.success) {
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
          component: 'AccountTab',
          action: 'deleteAccount',
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Account deletion error'
      )
      showError('Failed to delete account. Please try again.')
    } finally {
      setDeleteLoading(false)
      setDeleteDialogOpen(false)
      setDeletePassword('')
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
              void handleSubmit(handleChangePassword)(e)
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
          For security reasons, make sure to log out from other devices if you suspect any unauthorized access to your
          account.
        </Typography>
      </Box>

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
            To confirm account deletion, please enter your password:
          </Typography>
          <TextField
            fullWidth
            type={showDeletePassword ? 'text' : 'password'}
            label="Password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            disabled={deleteLoading}
            placeholder="Enter your password to confirm"
            slotProps={{
              input: {
                endAdornment: (
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
                ),
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
            disabled={!deletePassword || deleteLoading}
            startIcon={deleteLoading ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}>
            {deleteLoading ? 'Deleting...' : 'Delete Account'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
