import { type SvgIconProps } from '@mui/material'
import LanguageIcon from '@mui/icons-material/Language'
import React, { type ElementType, type ReactElement } from 'react'

import { SOCIAL_PLATFORMS } from '@/config/social'
import type { SocialProvider } from '@/types/profile.types'

/**
 * Renders the icon for a given social platform key, falling back to website icon.
 * Icon conveys platform identity with proper accessibility label.
 */
export function SocialPlatformIcon({
  platform,
  size = 28,
}: {
  platform?: SocialProvider
  size?: number
}): ReactElement {
  const config = SOCIAL_PLATFORMS.find((p) => p.key === platform) ?? SOCIAL_PLATFORMS.find((p) => p.key === 'website')
  const Icon = (config?.icon ?? LanguageIcon) as ElementType<SvgIconProps>

  const platformName = config?.name ?? 'Website'

  return <Icon sx={{ fontSize: size, color: 'primary.main' }} titleAccess={platformName} />
}
