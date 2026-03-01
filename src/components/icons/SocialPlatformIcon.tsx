import { type SvgIconProps } from '@mui/material'
import { SOCIAL_PLATFORMS } from '@/config/social'
import type { SocialProvider } from '@/types/profile.types'

/**
 * Renders the icon for a given social platform key, falling back to website icon.
 * Icon conveys platform identity with proper accessibility label.
 */
export function SocialPlatformIcon({ platform, size = 28 }: { platform?: SocialProvider; size?: number }): JSX.Element {
  const config = SOCIAL_PLATFORMS.find((p) => p.key === platform) ?? SOCIAL_PLATFORMS.find((p) => p.key === 'website')
  const fallbackIcon = SOCIAL_PLATFORMS.length > 0 && SOCIAL_PLATFORMS[SOCIAL_PLATFORMS.length - 1]?.icon
  // Explicit fallback icon function with return type
  const FallbackIcon: React.FC = (): JSX.Element | null => null
  const Icon = (config?.icon ?? fallbackIcon ?? FallbackIcon) as React.ElementType<SvgIconProps>

  const platformName = config?.name ?? 'Website'

  return Icon ? (
    <Icon sx={{ fontSize: size, color: 'primary.main' }} titleAccess={platformName} />
  ) : (
    <span role="img" aria-label={platformName} />
  )
}
