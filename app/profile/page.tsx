import { Container, Typography, Box } from '@mui/material'
import { redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { getCachedProfile } from '@/lib/actions/profile'
import ProfileForm from '@/components/profile/ProfileForm'
import { createClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger/server'
import { getProfileOgImageUrl, fullUrl, SITE_CONFIG } from '@/config/site'
import type { Profile } from '@/types/profile.types'

/**
 * Generate metadata for the profile page
 * Uses getCachedProfile for request-level memoization (dedupes with ProfilePage)
 */
export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch site configs for name
  // Use static site config
  const siteName = SITE_CONFIG.name

  // If no user, return default metadata
  if (!user) {
    return {
      title: 'Profile',
      description: 'Manage your profile settings and preferences',
    }
  }

  // Fetch profile data for OG image (cached - dedupes with ProfilePage call)
  let profile = null
  try {
    const result = await getCachedProfile(user.id)
    if (result.success) {
      profile = result.data
    }
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err : new Error('Unknown error'), userId: user.id },
      'Failed to load profile for metadata'
    )
  }

  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'User'
  const bio = profile?.bio ?? undefined
  const avatarUrl = profile?.avatar_url ?? undefined

  const ogImageUrl = getProfileOgImageUrl({
    name: displayName,
    avatar: avatarUrl !== null && avatarUrl !== undefined ? fullUrl(avatarUrl) : undefined,
    bio,
  })

  return {
    title: `${displayName} - Profile`,
    description: bio ?? 'Manage your profile settings and preferences',
    openGraph: {
      title: `${displayName} - ${siteName}`,
      description: bio ?? `View profile on ${siteName}`,
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
      title: `${displayName} - ${siteName}`,
      description: bio ?? `View profile on ${siteName}`,
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

  // Fetch profile data on the server for SSR
  let profile: Profile | null = null
  try {
    const result = await getCachedProfile(user.id)
    if (result.success) {
      profile = result.data ?? null
    }
  } catch (err) {
    logger.error(
      { err: err instanceof Error ? err : new Error('Unknown error'), userId: user.id },
      'Failed to fetch profile for SSR'
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
        Manage your profile settings and preferences
      </Typography>

      <Box sx={{ width: '100%' }}>
        <ProfileForm profile={profile} />
      </Box>
    </Container>
  )
}
