'use client'
import { useState } from 'react'
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useRouter } from 'next/navigation'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { handleError as handleClientError } from '@/lib/error/handlers/client.handler'
import { useBlockUser, useDeleteUser } from '@/hooks/useAdminUsers'
import type { AuthResponse } from '@/types/error.types'
import type { Profile } from '@/types/profile.types'

interface AdminActionsUserProps {
  profileId: string
  profile: Profile
  blockUserAction: (profileId: string) => Promise<AuthResponse<Profile>>
  deleteUserAction: (profileId: string) => Promise<AuthResponse<void>>
}

/**
 * Administrative actions for a user profile with built-in dialogs and actions.
 */
export function AdminActionsUser({
  profileId,
  profile,
  blockUserAction,
  deleteUserAction,
}: AdminActionsUserProps): JSX.Element {
  const router = useRouter()
  const { showSuccess, showError } = useSnackbar()
  const { blockUser: executeBlockUser, isPending: isBlocking } = useBlockUser({ blockUserAction })
  const { deleteUser: executeDeleteUser, isPending: isDeleting } = useDeleteUser({ deleteUserAction })

  const [blockDialogOpen, setBlockDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  const deleteConfirmationPhrase = `DELETE ${profile.email}`

  const handleBlockProfile = async (): Promise<void> => {
    try {
      await executeBlockUser(profileId)
      showSuccess('User blocked successfully')
      setBlockDialogOpen(false)
    } catch (error) {
      handleClientError(error, { operation: 'blockUser', userId: profileId })
      const message = error instanceof Error ? error.message : 'Failed to block user'
      showError(message)
    }
  }

  const handleDeleteProfile = async (): Promise<void> => {
    if (deleteConfirmation !== deleteConfirmationPhrase) {
      showError('Please type the exact confirmation phrase')
      return
    }

    try {
      await executeDeleteUser(profileId)
      showSuccess('User deleted successfully')
      setDeleteDialogOpen(false)
      router.push('/dashboard/users')
    } catch (error) {
      handleClientError(error, { operation: 'deleteUser', userId: profileId })
      const message = error instanceof Error ? error.message : 'Failed to delete user'
      showError(message)
    }
  }

  return (
    <>
      <Paper
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: 0,
        }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
          Administrative Actions
        </Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            color="warning"
            fullWidth
            onClick={() => setBlockDialogOpen(true)}
            disabled={isBlocking}
            sx={{ color: 'black', fontWeight: 700 }}>
            {isBlocking ? 'Blocking...' : 'Block User'}
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            onClick={() => setDeleteDialogOpen(true)}
            disabled={isDeleting}
            sx={{ fontWeight: 700 }}>
            {isDeleting ? 'Deleting...' : 'Delete User'}
          </Button>
        </Stack>
      </Paper>

      <Dialog open={blockDialogOpen} onClose={() => setBlockDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Block User</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Blocking this user will prevent them from logging in and accessing the platform. You can unblock them later
            if needed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBlockDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleBlockProfile} color="warning" variant="contained" disabled={isBlocking}>
            {isBlocking ? 'Blocking...' : 'Confirm Block'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              This action cannot be undone. Deleting the user will remove all their data and revoke access permanently.
            </Typography>
            <Alert severity="warning">
              To confirm, type <strong>{deleteConfirmationPhrase}</strong> below.
            </Alert>
            <TextField
              fullWidth
              label="Confirmation"
              value={deleteConfirmation}
              onChange={(event) => setDeleteConfirmation(event.target.value)}
              placeholder={deleteConfirmationPhrase}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setDeleteDialogOpen(false)
              setDeleteConfirmation('')
            }}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteProfile}
            color="error"
            variant="contained"
            disabled={isDeleting || deleteConfirmation !== deleteConfirmationPhrase}>
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
