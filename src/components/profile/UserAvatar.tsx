'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { Avatar } from '@mui/material'

import { useOptimizedAvatar } from '@/hooks/useOptimizedAvatar'
import { AVATAR_SIZES } from '@/lib/utils/image-utils'

/**
 * Size configuration for avatar display.
 * Exported for use by UserAvatarForm (container dimensions) and UsersTable.
 */
export const AVATAR_SIZE_CONFIG = {
  thumbnail: {
    width: 32,
    height: 32,
    fontSize: '0.875rem',
    optimizedSize: AVATAR_SIZES.thumbnail,
    srcSetSizes: '32px',
  },
  small: {
    width: 72,
    height: 72,
    fontSize: '1.5rem',
    optimizedSize: AVATAR_SIZES.small,
    srcSetSizes: '72px',
  },
  medium: {
    width: 120,
    height: 120,
    fontSize: '2.5rem',
    optimizedSize: AVATAR_SIZES.medium,
    srcSetSizes: '120px',
  },
  large: {
    width: { xs: 150, sm: 180, md: 200 },
    height: { xs: 150, sm: 180, md: 200 },
    fontSize: '4rem',
    optimizedSize: AVATAR_SIZES.large,
    srcSetSizes: '(max-width: 599px) 150px, (max-width: 899px) 180px, 200px',
  },
} as const

/**
 * Props for the simple UserAvatar component
 */
export interface UserAvatarProps {
  /**
   * Avatar image URL from Supabase Storage
   * Will be optimized using useOptimizedAvatar hook
   */
  avatarUrl: string | null | undefined

  /**
   * User's email address for fallback initials
   */
  email?: string

  /**
   * User's display name for fallback initials and alt text
   */
  displayName?: string

  /**
   * Avatar size preset
   * - thumbnail: 32x32 (table rows)
   * - small: 72x72 (dashboard cards)
   * - medium: 120x120 (profile cards)
   * - large: 150-200px responsive (profile page)
   * Default: 'medium'
   */
  size?: keyof typeof AVATAR_SIZE_CONFIG
}

/**
 * Helper function to get initials from display name or email
 */
function getInitials(displayName?: string, email?: string): string {
  if (displayName && displayName.length > 0) {
    return displayName[0]!.toUpperCase()
  }
  if (email && email.length > 0) {
    return email[0]!.toUpperCase()
  }
  return 'U'
}

/**
 * Simple reusable avatar component for displaying user avatars
 *
 * Displays optimized avatar images with automatic fallback to initials.
 * This is a read-only presentation component - use UserAvatarForm for editing.
 *
 * @example
 * ```tsx
 * <UserAvatar
 *   avatarUrl={profile.avatar_url}
 *   email={profile.email}
 *   displayName={profile.display_name}
 *   size="medium"
 * />
 * ```
 */
export function UserAvatar({ avatarUrl, email, displayName, size = 'medium' }: UserAvatarProps): ReactElement {
  const avatarUrls = useOptimizedAvatar(avatarUrl ?? null)
  const sizeConfig = AVATAR_SIZE_CONFIG[size]
  const initials = getInitials(displayName, email)
  const mediumUrl = avatarUrls.getUrl(AVATAR_SIZES.medium)
  const largeUrl = avatarUrls.getUrl(AVATAR_SIZES.large)

  return (
    <Avatar
      src={avatarUrls.getUrl(sizeConfig.optimizedSize) ?? undefined}
      alt={displayName ?? email ?? 'User'}
      sx={{
        width: sizeConfig.width,
        height: sizeConfig.height,
        fontSize: sizeConfig.fontSize,
        bgcolor: 'primary.main',
        color: 'primary.contrastText',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)',
      }}
      slotProps={{
        img: {
          loading: 'lazy',
          ...(mediumUrl && largeUrl
            ? {
                srcSet: `${mediumUrl} ${AVATAR_SIZES.medium.width}w, ${largeUrl} ${AVATAR_SIZES.large.width}w`,
                sizes: sizeConfig.srcSetSizes,
              }
            : {}),
        },
      }}>
      {initials}
    </Avatar>
  )
}
