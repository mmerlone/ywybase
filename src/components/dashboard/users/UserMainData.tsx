'use client'

import React, { type ReactElement } from 'react'
import { Box, Paper, Stack, Typography, Divider } from '@mui/material'
import { ProviderBadge } from '@/components/auth/ProviderBadge'
import { UserRoleBadge } from '@/components/common/UserRoleBadge'
import { UserStatusBadge } from '@/components/common/UserStatusBadge'
import { UserAvatar } from '@/components/profile/UserAvatar'
import type { Profile } from '@/types/profile.types'
import { getUserBadges } from '@/lib/utils/profile-utils'

interface UserMainDataProps {
  profile: Profile
  formatDate: (date: string | null | undefined) => string
  formatBoolean: (value?: boolean | null) => string
}

export function UserMainData({ profile, formatDate, formatBoolean }: UserMainDataProps): ReactElement {
  const metadataItems: Array<{ label: string; value: string }> = [
    { label: 'Last Sign In', value: formatDate(profile.last_sign_in_at) },
    { label: 'Last Updated', value: formatDate(profile.updated_at) },
    { label: 'Onboarded', value: formatBoolean(profile.is_onboarded) },
  ]

  // Get full badge set (role, status, and identity badges)
  const badgeData = getUserBadges(profile)

  return (
    <Paper
      sx={{
        p: 3,
        borderRadius: 2,
        height: '100%',
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: 0,
      }}>
      <Stack spacing={3}>
        <UserAvatar
          avatarUrl={profile.avatar_url}
          email={profile.email}
          displayName={profile.display_name ?? 'Unnamed User'}
          size="small"
        />

        {badgeData && (
          <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent="center">
            <UserStatusBadge status={badgeData.status} />
            <UserRoleBadge role={badgeData.role} />
            {badgeData.identities.map((provider) => (
              <ProviderBadge key={provider} provider={provider} />
            ))}
          </Stack>
        )}

        <Divider />

        <Stack spacing={1.5}>
          <Typography variant="subtitle2" color="text.secondary">
            Metadata
          </Typography>
          {metadataItems.map((item) => (
            <Box key={item.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Stack>
    </Paper>
  )
}
