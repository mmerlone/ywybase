'use client'

import React, { useState } from 'react'
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowBack as BackIcon, Email as EmailIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

import { UserDetailsSkeleton } from '@/components/dashboard/users/UserDetailsSkeleton'
import { UserMainData } from '@/components/dashboard/users/UserMainData'
import { UserProfileData } from '@/components/dashboard/users/UserProfileData'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useBlockUser, useDeleteUser, useProfileDetails } from '@/hooks/useAdminUsers'
import { handleError as handleClientError } from '@/lib/error/handlers/client.handler'
import type { AuthResponse } from '@/types/error.types'
import type { Profile, SocialLink } from '@/types/profile.types'

interface UserDetailsClientProps {
  profileId: string
  initialData: Profile | null
  fetchProfileAction: (profileId: string) => Promise<AuthResponse<Profile>>
  blockUserAction: (profileId: string) => Promise<AuthResponse<Profile>>
  deleteUserAction: (profileId: string) => Promise<AuthResponse<void>>
}

export default function UserDetailsClient({
  profileId,
  initialData,
  fetchProfileAction,
  blockUserAction,
  deleteUserAction,
}: UserDetailsClientProps): JSX.Element {
  const router = useRouter()
  const { profile, isLoading, error } = useProfileDetails(profileId, {
    fetchProfile: fetchProfileAction,
    initialData,
  })
  const { blockUser: executeBlockUser, isPending: isBlocking } = useBlockUser({ blockUserAction })
  const { deleteUser: executeDeleteUser, isPending: isDeleting } = useDeleteUser({ deleteUserAction })
  const { showSuccess, showError } = useSnackbar()

  // Block user state
  const [blockDialogOpen, setBlockDialogOpen] = useState(false)

  // Delete user state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState('')

  if (!profileId) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          Invalid user ID.
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  if (isLoading) {
    return <UserDetailsSkeleton />
  }

  if (error || !profile) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {/* eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty message should trigger fallback */}
          {error?.message || 'User not found.'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'Never'
    try {
      return format(new Date(date), 'PP p')
    } catch {
      return 'Invalid date'
    }
  }

  const formatText = (value?: string | null): string => {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value
    }
    return '-'
  }

  const formatBoolean = (value?: boolean | null): string => {
    if (value === null || value === undefined) return 'Unknown'
    return value ? 'Yes' : 'No'
  }

  // Block profile handler
  const handleBlockProfile = async (): Promise<void> => {
    if (!profileId) return

    try {
      await executeBlockUser(profileId)
      showSuccess('User blocked successfully')
      setBlockDialogOpen(false)
    } catch (blockError) {
      handleClientError(blockError, { operation: 'blockUser', userId: profileId })
      const message = blockError instanceof Error ? blockError.message : 'Failed to block user'
      showError(message)
    }
  }

  // Delete profile handler
  const handleDeleteProfile = async (): Promise<void> => {
    if (!profileId || !profile) return

    const expectedConfirmation = `DELETE ${profile.email}`
    if (deleteConfirmation !== expectedConfirmation) {
      showError('Please type the exact confirmation phrase')
      return
    }

    try {
      await executeDeleteUser(profileId)
      showSuccess('User deleted successfully')
      setDeleteDialogOpen(false)
      router.push('/dashboard/users')
    } catch (deleteError) {
      handleClientError(deleteError, { operation: 'deleteUser', userId: profileId })
      const message = deleteError instanceof Error ? deleteError.message : 'Failed to delete user'
      showError(message)
    }
  }

  // Delete confirmation phrase
  const deleteConfirmationPhrase = profile ? `DELETE ${profile.email}` : ''

  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing -- empty strings should fall through to next candidate
  const userIdentifier = profile.display_name || profile.first_name || profile.email

  return (
    <Box>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={5}>
          <Stack direction="row" spacing={2} alignItems="center">
            <IconButton onClick={() => router.back()} sx={{ mr: 1 }} aria-label="Go back">
              <BackIcon />
            </IconButton>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {userIdentifier}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {profile.id}
              </Typography>
            </Box>
          </Stack>

          <Grid container spacing={4}>
            {/* User's main data */}
            <Grid size={{ xs: 12, md: 4 }}>
              <UserMainData profile={profile} formatDate={formatDate} formatBoolean={formatBoolean} />
            </Grid>

            {/* User's profile data */}
            <Grid size={{ xs: 12, md: 8 }}>
              <UserProfileData profile={profile} formatDate={formatDate} formatText={formatText} />
            </Grid>
          </Grid>

          <Divider />

          {/* Administrative Actions & Communications */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 0,
                }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Communication
                </Typography>
                <Stack spacing={2}>
                  <Button
                    variant="text"
                    startIcon={<EmailIcon />}
                    href={`mailto:${profile.email}`}
                    sx={{ justifyContent: 'flex-start', px: 0 }}>
                    Send Email ({profile.email})
                  </Button>
                  {profile.social_links && profile.social_links.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                        Social Links
                      </Typography>
                      <Stack direction="row" spacing={2} flexWrap="wrap">
                        {profile.social_links.map((link: SocialLink) => (
                          <MuiLink key={link.id} href={link.url} target="_blank" rel="noopener" underline="hover">
                            {link.title}
                          </MuiLink>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Paper>

      {/* Block User Dialog */}
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

      {/* Delete User Dialog */}
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
    </Box>
  )
}
