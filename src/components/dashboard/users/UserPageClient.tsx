'use client'

import React from 'react'
import { Alert, Box, Button, Divider, Grid, IconButton, Paper, Stack, Typography } from '@mui/material'
import { ArrowBack as BackIcon } from '@mui/icons-material'
import { useRouter } from 'next/navigation'

import { AdminActionsUser } from '@/components/admin/AdminActionsUser'
import { UserCard } from '@/components/profile/UserCard'
import { UserPageSkeleton } from '@/components/dashboard/users/UserPageSkeleton'
import { UserProfileData } from '@/components/dashboard/users/UserProfileData'
import { formatBoolean, formatDate } from '@/lib/utils/string-utils'
import { useProfileDetails } from '@/hooks/useAdminUsers'
import type { AuthResponse } from '@/types/error.types'
import type { Profile } from '@/types/profile.types'

interface UserPageClientProps {
  profileId: string
  initialData: Profile | null
  fetchProfileAction: (profileId: string) => Promise<AuthResponse<Profile>>
  blockUserAction: (profileId: string) => Promise<AuthResponse<Profile>>
  deleteUserAction: (profileId: string) => Promise<AuthResponse<void>>
}

export default function UserPageClient({
  profileId,
  initialData,
  fetchProfileAction,
  blockUserAction,
  deleteUserAction,
}: UserPageClientProps): JSX.Element {
  const router = useRouter()
  const { profile, isLoading, error } = useProfileDetails(profileId, {
    fetchProfile: fetchProfileAction,
    initialData,
  })

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
    return <UserPageSkeleton />
  }

  if (error ?? !profile) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error?.message ?? 'User not found.'}
        </Alert>
        <Button startIcon={<BackIcon />} onClick={() => router.back()}>
          Go Back
        </Button>
      </Box>
    )
  }

  const userIdentifier = profile.display_name ?? profile.first_name ?? profile.email

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
            <Grid size={{ xs: 12, md: 4 }}>
              <UserCard profile={profile} formatDate={formatDate} formatBoolean={formatBoolean} />
            </Grid>

            <Grid size={{ xs: 12, md: 8 }}>
              <UserProfileData profile={profile} />
            </Grid>
          </Grid>

          <Divider />

          {/* Administrative Actions & Communications */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <AdminActionsUser
                profileId={profileId}
                profile={profile}
                blockUserAction={blockUserAction}
                deleteUserAction={deleteUserAction}
              />
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Box>
  )
}
