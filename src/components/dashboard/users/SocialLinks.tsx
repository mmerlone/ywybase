'use client'

import React, { type ReactElement } from 'react'
import { Box, Grid, Typography } from '@mui/material'

import { SocialLinkCard } from '@/components/profile/SocialLinkCard'
import type { SocialLink } from '@/types/profile.types'

/**
 * Props for the SocialLinks dashboard section.
 */
export interface SocialLinksProps {
  socialLinks: SocialLink[]
  userAvatarUrl: string | null | undefined
  userEmail?: string
  userDisplayName?: string
}

/**
 * Dashboard-only social links section for user profiles.
 */
export function SocialLinks({
  socialLinks,
  userAvatarUrl,
  userEmail,
  userDisplayName,
}: SocialLinksProps): ReactElement {
  return (
    <Box>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        Social Links
      </Typography>
      {socialLinks.length > 0 ? (
        <Grid container spacing={2}>
          {socialLinks.map((link) => (
            <Grid size={{ xs: 12, sm: 6 }} key={link.id}>
              <SocialLinkCard
                link={link}
                onEdit={() => undefined}
                onDelete={() => undefined}
                userAvatarUrl={userAvatarUrl}
                userEmail={userEmail}
                userDisplayName={userDisplayName}
              />
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No social links yet
        </Typography>
      )}
    </Box>
  )
}
