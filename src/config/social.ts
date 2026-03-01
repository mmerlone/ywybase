import GitHubIcon from '@mui/icons-material/GitHub'
import LinkedInIcon from '@mui/icons-material/LinkedIn'
import TwitterIcon from '@mui/icons-material/Twitter'
import InstagramIcon from '@mui/icons-material/Instagram'
import FacebookIcon from '@mui/icons-material/Facebook'
import YouTubeIcon from '@mui/icons-material/YouTube'
import LanguageIcon from '@mui/icons-material/Language'
import type { SocialProvider } from '@/types/profile.types'

/**
 * Open Graph metadata structure used for social previews.
 */
export interface SocialOgMeta {
  /** Title for the social preview */
  title?: string
  /** Description for the social preview */
  description?: string
  /** Preview image URL */
  image?: string
}

/**
 * Raw provider metadata shape from Supabase auth user metadata.
 */
export type SocialProviderRawMeta = Record<string, unknown>

/**
 * Social platform configuration for profile social links.
 *
 * @remarks
 * This is the single source of truth for supported platforms, including:
 * - key: unique identifier
 * - name: display name
 * - icon: MUI icon component
 * - hostnames: array of valid hostnames (for strict URL validation)
 * - colors: theme-aware color config
 * - urlPrefix: canonical URL prefix for new links
 */
export interface SocialPlatformConfig {
  /** Unique key for the platform (e.g., 'github') */
  key: SocialProvider
  /** Human-readable name (e.g., 'GitHub') */
  name: string
  /** MUI icon component for the platform */
  icon: React.ElementType
  /** Array of valid hostnames for strict URL validation */
  hostnames: string[]
  /** Theme-aware color config */
  colors: {
    light: string
    dark: string
  }
  /** Canonical URL prefix for new links */
  urlPrefix: string
  /**
   * OG endpoint URL template for platforms that support it.
   * Use {url} as placeholder for the encoded profile URL.
   * The presence of this field allows OG fetching for the platform.
   * @example 'https://www.linkedin.com/oembed?url={url}'
   */
  ogUrl?: string
  /**
   * Mapping rules for deriving OG metadata from auth provider raw_user_meta_data.
   * Only used when the user has connected the platform as an auth provider.
   */
  ogMapping?: {
    /** Keys used to build a title */
    titleKeys?: string[]
    /** Keys used to build a description */
    descriptionKeys?: string[]
    /** Keys used to build an image URL */
    imageKeys?: string[]
    /** Optional first/last name mapping for title composition */
    nameParts?: {
      firstKeys: string[]
      lastKeys: string[]
    }
  }
}

/**
 * List of supported social platforms for user profiles.
 * Only URLs with these hostnames are accepted for each platform.
 */
export const SOCIAL_PLATFORMS: SocialPlatformConfig[] = [
  {
    key: 'github',
    name: 'GitHub',
    icon: GitHubIcon,
    hostnames: ['github.com'],
    colors: { light: '#181717', dark: '#f5f5f5' },
    urlPrefix: 'https://github.com/',
    ogUrl: 'https://api.github.com/users/{username}',
    ogMapping: {
      titleKeys: ['name', 'login'],
      descriptionKeys: ['bio'],
      imageKeys: ['avatar_url'],
    },
  },
  {
    key: 'linkedin',
    name: 'LinkedIn',
    icon: LinkedInIcon,
    hostnames: ['linkedin.com'],
    colors: { light: '#0077B5', dark: '#eaf4fb' },
    urlPrefix: 'https://linkedin.com/in/',
    ogUrl: 'https://www.linkedin.com/oembed?url={url}&format=json',
    ogMapping: {
      nameParts: {
        firstKeys: ['given_name', 'first_name', 'localizedFirstName'],
        lastKeys: ['family_name', 'last_name', 'localizedLastName'],
      },
      titleKeys: ['name', 'title', 'author_name'],
      imageKeys: ['picture', 'avatar_url', 'thumbnail_url'],
    },
  },
  {
    key: 'twitter',
    name: 'Twitter/X',
    icon: TwitterIcon,
    hostnames: ['twitter.com', 'x.com'],
    colors: { light: '#1DA1F2', dark: '#e8f5fd' },
    urlPrefix: 'https://twitter.com/',
    ogMapping: {
      titleKeys: ['name', 'full_name', 'user_name', 'preferred_username'],
      imageKeys: ['avatar_url', 'picture'],
    },
  },
  {
    key: 'instagram',
    name: 'Instagram',
    icon: InstagramIcon,
    hostnames: ['instagram.com'],
    colors: { light: '#E4405F', dark: '#fce4ec' },
    urlPrefix: 'https://instagram.com/',
  },
  {
    key: 'facebook',
    name: 'Facebook',
    icon: FacebookIcon,
    hostnames: ['facebook.com'],
    colors: { light: '#1877F3', dark: '#e7f0fa' },
    urlPrefix: 'https://facebook.com/',
    ogMapping: {
      titleKeys: ['name', 'full_name'],
      imageKeys: ['picture', 'avatar_url'],
    },
  },
  {
    key: 'youtube',
    name: 'YouTube',
    icon: YouTubeIcon,
    hostnames: ['youtube.com', 'youtu.be'],
    colors: { light: '#FF0000', dark: '#ffeaea' },
    urlPrefix: 'https://youtube.com/',
  },
  {
    key: 'website',
    name: 'Website',
    icon: LanguageIcon,
    hostnames: [], // Accepts any valid https URL not matching above
    colors: { light: '#64748b', dark: '#e0e7ef' },
    urlPrefix: 'https://',
  },
]

/**
 * Type for all supported social platform keys.
 */
export type SocialPlatformKey = (typeof SOCIAL_PLATFORMS)[number]['key']

/**
 * Maximum number of social links per profile.
 */
export const MAX_SOCIAL_LINKS = 10
