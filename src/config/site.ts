import * as Sentry from '@sentry/nextjs'
import type { Metadata } from 'next'

import { ROUTES } from '@/config/routes'

export const GITHUB_URL = 'https://github.com/mmerlone/ywybase'
// Maximum number of social links per profile

type NavigationItemTarget = '_self' | '_blank' | '_parent' | '_top'
export interface NavigationItem {
  label: string
  link: string
  target?: NavigationItemTarget
}

export const SITE_CONFIG = {
  // Site URLs
  url: 'https://ywybase.vercel.app',
  github: GITHUB_URL,

  // Site Info
  name: 'YwyBase',
  title: 'YwyBase',
  description:
    'YwyBase - A Solid Ground to Scale. A comprehensive Next.js application with authentication, Material UI, and modern best practices',
  project_key: 'ywybase',

  theme: 'concrete',
  // theme: 'mui',
  // theme: 'ywybase',

  // Author/Creator Info
  author: 'Marcio Merlone',

  // Social Images
  ogImage: {
    url: '/api/og',
    width: 1200,
    height: 630,
    alt: 'YwyBase - Solid Ground to Scale',
    type: 'image/png',
  },

  // SEO
  robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',

  // Social Media
  twitter: {
    card: 'summary_large_image' as const,
  },

  // Open Graph
  openGraph: {
    type: 'website' as const,
    locale: 'en_US' as const,
  },

  // Support and Contact
  support: {
    url: GITHUB_URL + '/issues',
  },

  // Auth Configuration
  auth: {
    resendVerificationCooldown: 60, // seconds
  } as const,

  // Password requirements
  passwordRequirements: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true,
    requireSpecialChar: true,
    specialChars: '!@#$%^&*(),.?:{}|<>',
  } as const,

  // Layout Configuration
  layout: {
    fixedHeader: true,
    fixedFooter: false,
    smallFooter: false,
  } as const,

  navigation: [
    { label: 'About', link: '/about' },
    { label: 'Dashboard', link: ROUTES.DASHBOARD.path },
    { label: 'Demos', link: '/demos' },
    { label: 'GitHub', link: GITHUB_URL, target: '_blank' },
  ] satisfies readonly NavigationItem[],

  logging: null,
}

// Helper to generate full URL for a given path
export const fullUrl = (path: string): string => {
  return new URL(path, SITE_CONFIG.url).toString()
}

/**
 * Generate OG image URL with optional parameters
 *
 * @param options - Configuration for the OG image
 * @returns Full URL to the OG image API endpoint
 *
 * @example
 * ```ts
 * getOgImageUrl() // Default site OG image
 * getOgImageUrl({ title: 'Custom Title' }) // Custom title
 * getOgImageUrl({ title: 'Page', description: 'Description' }) // Title + description
 * ```
 */
export const getOgImageUrl = (options?: { title?: string; description?: string }): string => {
  const params = new URLSearchParams()
  if (options?.title) params.set('title', options.title)
  if (options?.description) params.set('description', options.description)
  const queryString = params.toString()
  return fullUrl(`/api/og${queryString ? `?${queryString}` : ''}`)
}

/**
 * Generate profile-specific OG image URL
 *
 * @param options - Profile configuration for the OG image
 * @returns Full URL to the profile OG image API endpoint
 *
 * @example
 * ```ts
 * getProfileOgImageUrl({ name: 'John Doe' })
 * getProfileOgImageUrl({ name: 'Jane', avatar: 'https://...', bio: 'Developer' })
 * ```
 */
export const getProfileOgImageUrl = (options: { name: string; avatar?: string; bio?: string }): string => {
  const params = new URLSearchParams()
  params.set('name', options.name)
  if (options.avatar) params.set('avatar', options.avatar)
  if (options.bio) params.set('bio', options.bio)
  return fullUrl(`/api/og/profile?${params.toString()}`)
}

// Generate metadata object
export const getSiteMetadata = (): Metadata => ({
  metadataBase: new URL(SITE_CONFIG.url),
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  keywords: ['Next.js', 'React', 'TypeScript', 'Material UI', 'Supabase', 'Authentication'],
  authors: [{ name: SITE_CONFIG.author }],
  creator: SITE_CONFIG.author,
  publisher: SITE_CONFIG.author,
  robots: SITE_CONFIG.robots,
  openGraph: {
    ...SITE_CONFIG.openGraph,
    url: '/',
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    siteName: SITE_CONFIG.name,
    images: [
      {
        url: fullUrl(SITE_CONFIG.ogImage.url),
        width: SITE_CONFIG.ogImage.width,
        height: SITE_CONFIG.ogImage.height,
        alt: SITE_CONFIG.ogImage.alt,
        type: SITE_CONFIG.ogImage.type,
      },
    ],
  },
  twitter: {
    ...SITE_CONFIG.twitter,
    title: SITE_CONFIG.title,
    description: SITE_CONFIG.description,
    images: [
      {
        url: fullUrl(SITE_CONFIG.ogImage.url),
        width: SITE_CONFIG.ogImage.width,
        height: SITE_CONFIG.ogImage.height,
        alt: SITE_CONFIG.ogImage.alt,
      },
    ],
  },
  other: {
    ...Sentry.getTraceData(),
  },
})
