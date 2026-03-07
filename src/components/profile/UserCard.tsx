'use client'
import { Box, Card, Stack, Typography, Divider, Link } from '@mui/material'

import { ProviderBadge } from '@/components/auth/ProviderBadge'
import { UserRoleBadge } from '@/components/dashboard/users/profile/UserRoleBadge'
import { UserStatusBadge } from '@/components/dashboard/users/profile/UserStatusBadge'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { UserAvatarForm } from '@/components/profile/UserAvatarForm'
import { getUserBadges } from '@/lib/utils/profile-utils'
import type { Profile } from '@/types/profile.types'

import { Email as EmailIcon, Link as LinkIcon } from '@mui/icons-material'

interface UserCardProps {
  profile: Profile | null
  formatDate: (date: string | null | undefined) => string
  formatBoolean: (value?: boolean | null) => string
  /** When true, render UserAvatarForm with editing controls (profile page) */
  avatarForm?: boolean
  /** Size of the avatar */
  avatarSize?: 'sm' | 'md' | 'lg'
  /** User ID for profile operations (required if avatarForm=true) */
  userId?: string
  /** Show loading skeleton instead of content */
  isLoading?: boolean
}

const AVATAR_SIZE_MAP = {
  sm: {
    preset: 'small',
    dimension: 72,
  },
  md: {
    preset: 'medium',
    dimension: 120,
  },
  lg: {
    preset: 'large',
    dimension: { xs: 150, sm: 180, md: 200 },
  },
} as const

export function UserCard({
  profile,
  formatDate,
  formatBoolean,
  avatarForm,
  userId,
  avatarSize = 'sm',
}: UserCardProps): JSX.Element {
  const avatarConfig = AVATAR_SIZE_MAP[avatarSize]
  const canEditAvatar = Boolean(avatarForm && userId)

  // Profile is required at this point (parent handles loading state)
  if (!profile) return <></>

  // Prepare data
  const metadataItems = [
    { label: 'Created at', value: formatDate(profile.created_at) },
    { label: 'Last Updated', value: formatDate(profile.updated_at) },
    { label: 'Last Sign In', value: formatDate(profile.last_sign_in_at) },
    { label: 'Onboarded', value: formatBoolean(profile.is_onboarded) },
  ]

  const badgeData = getUserBadges(profile)
  const badges = badgeData
    ? [<UserStatusBadge key="status" status={badgeData.status} />, <UserRoleBadge key="role" role={badgeData.role} />]
    : []

  return (
    <Card
      sx={{
        position: 'relative',
        p: 3,
        borderRadius: 3,
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.15)',
          transition: 'all 0.3s ease-in-out',
        },
        transition: 'all 0.3s ease-in-out',
      }}>
      <Stack spacing={3}>
        <Stack spacing={2} alignItems="center">
          {canEditAvatar ? (
            <UserAvatarForm
              avatarUrl={profile.avatar_url}
              email={profile.email}
              displayName={profile.display_name}
              size={avatarConfig.preset}
              userId={userId}
            />
          ) : (
            <UserAvatar
              avatarUrl={profile.avatar_url}
              email={profile.email}
              displayName={profile.display_name || 'Unnamed User'}
              size={avatarConfig.preset}
            />
          )}
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: 'white',
              textAlign: 'center',
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}>
            {profile.display_name || 'Unnamed User'}
          </Typography>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)', textAlign: 'center' }}>
            <Link
              href={`mailto:${profile.email}`}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: 'rgba(255, 255, 255, 0.9)',
                textDecoration: 'none',
                justifyContent: 'center',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'white',
                },
              }}>
              <EmailIcon sx={{ fontSize: 16 }} />
              {profile.email}
            </Link>
            {profile.website && (
              <Link
                href={profile.website}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'rgba(255, 255, 255, 0.9)',
                  textDecoration: 'none',
                  justifyContent: 'center',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'white',
                  },
                }}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2">
                <LinkIcon sx={{ fontSize: 16 }} />
                {profile.website}
              </Link>
            )}
          </Typography>
          {badges.length > 0 && (
            <Stack direction="row" spacing={1} alignItems="center">
              {badges}
            </Stack>
          )}
        </Stack>

        <Stack spacing={2}>
          <Divider
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&::before, &::after': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Identities
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {profile.providers && profile.providers.length > 0 ? (
              profile.providers.map((provider) => <ProviderBadge provider={provider} key={provider} />)
            ) : (
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                No linked identities
              </Typography>
            )}
          </Box>
          <Divider
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.2)',
              '&::before, &::after': {
                borderColor: 'rgba(255, 255, 255, 0.2)',
              },
            }}>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>
              Metadata
            </Typography>
          </Divider>
          {metadataItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.5rem' }}>
                {item.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.5rem' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
