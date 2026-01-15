import { Container, Typography, Box, Alert } from '@mui/material'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getProfile } from '@/lib/actions/profile'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { serverLogger as logger } from '@/lib/logger'
import { getProfileOgImageUrl, fullUrl, SITE_CONFIG } from '@/config/site'

/**
 * Generate metadata for the profile page
 *
 * Creates dynamic OG images based on user profile data.
 * Falls back to default site metadata if user is not authenticated.
 */
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If no user, return default metadata
  if (!user) {
    return {
      title: 'Profile',
      description: 'Manage your profile settings and preferences',
    }
  }

  // Fetch profile data for OG image
  let profile = null
  try {
    const result = await getProfile(user.id)
    if (result.success) {
      profile = result.data
    }
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err : new Error('Unknown error'), userId: user.id },
      'Failed to load profile for metadata'
    )
  }

  const displayName = profile?.display_name || user.email?.split('@')[0] || 'User'
  const bio = profile?.bio || undefined
  const avatarUrl = profile?.avatar_url || undefined

  const ogImageUrl = getProfileOgImageUrl({
    name: displayName,
    avatar: avatarUrl ? fullUrl(avatarUrl) : undefined,
    bio,
  })

  return {
    title: `${displayName} - Profile`,
    description: bio || 'Manage your profile settings and preferences',
    openGraph: {
      title: `${displayName} - ${SITE_CONFIG.name}`,
      description: bio || 'View profile on YwyBase',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${displayName}'s Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${displayName} - ${SITE_CONFIG.name}`,
      description: bio || 'View profile on YwyBase',
      images: [ogImageUrl],
    },
  }
}

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
