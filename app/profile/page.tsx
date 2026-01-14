import { Container, Typography, Box, Alert } from '@mui/material'
import { redirect } from 'next/navigation'
import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { serverLogger as logger } from '@/lib/logger'

export default async function ProfilePage(): Promise<JSX.Element> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Fetch profile data server-side
  let profile = null
  let error = null

  try {
    const result = await getProfile(user.id)
    if (result.success) {
      profile = result.data ?? null
    } else {
      error = result.error
      // Convert AppErrorJSON to Error for logging
      const errorObj =
        typeof result.error === 'string'
          ? new Error(result.error)
          : new Error(result.error?.message || 'Failed to load profile')
      logger.error({ err: errorObj, userId: user.id }, 'Failed to load profile')
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
    error = errorMessage
    logger.error(
      {
        err: err instanceof Error ? err : new Error(errorMessage),
        userId: user.id,
        stack: err instanceof Error ? err.stack : undefined,
      },
      'Unexpected error in ProfilePage'
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage your profile settings and preferences
      </Typography>

      <Box sx={{ width: '100%' }}>
        {error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Failed to load profile. Please try again later.
          </Alert>
        ) : (
          <ProfileForm user={user} profile={profile} />
        )}
      </Box>
    </Container>
  )
}
