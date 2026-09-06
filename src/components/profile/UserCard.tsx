'use client'
import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Card, Stack, Typography, Divider, Link } from '@mui/material'

import { ProviderBadge } from '@/components/auth/ProviderBadge'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { UserStatusBadge } from '@/components/common/UserStatusBadge'
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
}: UserCardProps): ReactElement {
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
    ? [
        <UserStatusBadge key="status" status={badgeData.status} variant="inverse" />,
        <UserRoleBadge key="role" role={badgeData.role} variant="inverse" />,
      ]
    : []

  return (
    <Card
      sx={(theme) => ({
        position: 'relative',
        p: 3,
        borderRadius: 3,
        height: '100%',
        background: `linear-gradient(135deg, color-mix(in srgb, ${theme.vars.palette.background.paper} 80%, transparent) 0%, rgb(${theme.vars.palette.primary.mainChannel} / 0.04) 100%)`,
        border: `1px solid color-mix(in srgb, ${theme.vars.palette.divider} 80%, transparent)`,
        boxShadow: '0 8px 32px rgb(0 0 0 / 0.12)',
        backdropFilter: 'blur(10px)',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 12px 40px rgb(0 0 0 / 0.18)',
          transition: 'all 0.3s ease-in-out',
        },
        transition: 'all 0.3s ease-in-out',
      })}>
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
              color: 'text.primary',
              textAlign: 'center',
            }}>
            {profile.display_name || 'Unnamed User'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
            <Link
              href={`mailto:${profile.email}`}
              sx={{
                display: 'flex',
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.25)',
                alignItems: 'center',
                gap: 1,
                color: 'primary.main',
                textDecoration: 'none',
                justifyContent: 'center',
                '&:hover': {
                  textDecoration: 'underline',
                  color: 'primary.dark',
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
                  color: 'primary.main',
                  textDecoration: 'none',
                  justifyContent: 'center',
                  '&:hover': {
                    textDecoration: 'underline',
                    color: 'primary.dark',
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
              borderColor: 'divider',
              '&::before, &::after': {
                borderColor: 'divider',
              },
            }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Identities
            </Typography>
          </Divider>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {profile.providers && profile.providers.length > 0 ? (
              profile.providers.map((provider) => <ProviderBadge provider={provider} key={provider} />)
            ) : (
              <Typography variant="body2" color="text.secondary">
                No linked identities
              </Typography>
            )}
          </Box>
          <Divider
            sx={{
              borderColor: 'divider',
              '&::before, &::after': {
                borderColor: 'divider',
              },
            }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
              Metadata
            </Typography>
          </Divider>
          {metadataItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.5rem' }}>
                {item.label}
              </Typography>
              <Typography variant="body2" color="text.primary" sx={{ fontWeight: 600, fontSize: '0.5rem' }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Card>
  )
}
