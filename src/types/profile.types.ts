/**
 * Social providers supported for profile social links.
 * Mirrors the keys in SOCIAL_PLATFORMS config.
 */
export const SocialProvidersEnum = {
  GITHUB: 'github',
  LINKEDIN: 'linkedin',
  TWITTER: 'twitter',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  YOUTUBE: 'youtube',
  WEBSITE: 'website',
} as const

/**
 * Type representing the string literal union of all SocialProvider values.
 */
export type SocialProvider = (typeof SocialProvidersEnum)[keyof typeof SocialProvidersEnum]

/**
 * Profile Types
 *
 * Type definitions for user profile management.
 * Includes profile data structures, form types, and preferences.
 */

import { type Control, type FieldErrors, type UseFormRegister, type UseFormWatch } from 'react-hook-form'

import { type DbProfile } from './database'

import { type ProfileFormValues } from '@/lib/validators/profile'
import type { AuthProvider } from './auth.types'
import type { ThemePreference } from './theme.types'
import { type UserRole } from './admin.types'

/**
 * Provider information structure.
 * Represents an authentication provider with its identifier and display name.
 */
export interface ProviderInfo {
  /** Provider identifier (e.g., 'email', 'google') */
  id: AuthProvider
  /** Human-readable provider name (e.g., 'Email', 'Google') */
  name: string
}

/**
 * Fields that are computed/parsed from JSON database columns.
 * These fields have different types in the application vs database layer.
 */
export type ProfileComputed =
  | 'privacy_settings'
  | 'gender'
  | 'notification_preferences'
  | 'social_links'
  | 'theme'
  | 'role'

/**
 * Fields that are auto-generated or synced from auth.users.
 * These fields cannot be manually set during insert/update operations.
 */
export type ProfileAutoSync =
  | 'id'
  | 'updated_at'
  | 'created_at'
  | 'confirmed_at'
  | 'last_sign_in_at'
  | 'banned_until'
  | 'providers'

/**
 * Application-level profile type with parsed JSON fields.
 * Extends the database profile type with properly typed JSON columns and additional required fields.
 *
 * @remarks
 * This type replaces the raw JSON fields from the database with their
 * corresponding TypeScript types for better type safety throughout the application.
 *
 * Auth-synced fields (created_at, confirmed_at, last_sign_in_at, banned_until, providers)
 * are read-only and managed by background sync jobs from auth.users.
 *
 * @example
 * ```typescript
 * const profile: Profile = {
 *   id: '123',
 *   email: 'user@example.com',
 *   display_name: 'John Doe',
 *   role: 'user',
 *   status: 'active',
 *   created_at: '2026-01-20T00:00:00.000Z',
 *   confirmed_at: '2026-01-20T00:05:00.000Z',
 *   last_sign_in_at: '2026-01-26T10:00:00.000Z',
 *   providers: ['email', 'google'],
 *   privacy_settings: { data_sharing: { third_parties: false, analytics: true, marketing: false }, communication_preferences: { email: true, push: false, sms: false } },
 *   gender: 'male',
 *   notification_preferences: 'email',
 *   social_links: [{ id: '1', url: 'https://twitter.com/user', title: 'Twitter' }]
 * };
 * ```
 */
export type Profile = Omit<DbProfile, ProfileComputed> & {
  /** User's interface theme preference */
  theme: ThemePreference
  /**
   * User role in the application.
   * Database profiles have 'user' | 'moderator' | 'admin' | 'root'.
   * Application adds 'guest' for unauthenticated users (not stored in database).
   */
  role: UserRole
  /** User's privacy and consent settings */
  privacy_settings?: PrivacySettings | null
  /** User's gender preference */
  gender?: GenderPreference | null
  /** Preferred notification channels */
  notification_preferences?: NotificationPreferences | null
  /** Collection of social media links */
  social_links?: SocialLinks
  /** User status (cannot be null) */
  status: UserStatus
  /** Account creation timestamp (synced from auth.users) */
  created_at: string | null
  /** Email confirmation timestamp (synced from auth.users) */
  confirmed_at: string | null
  /** Last sign-in timestamp (synced from auth.users) */
  last_sign_in_at: string | null
  /** Ban expiration timestamp (synced from auth.users) */
  banned_until: string | null
  /** Authentication providers (synced from auth.identities) */
  providers: AuthProvider[]
}

/**
 * Type for updating profile data.
 * All fields are optional and excludes immutable and auth-synced fields.
 */
export type ProfileUpdate = Partial<Omit<Profile, ProfileAutoSync>>

/**
 * Type for inserting new profile data.
 * Excludes auto-generated and auth-synced fields.
 */
export type ProfileInsert = Omit<Profile, ProfileAutoSync>

/**
 * Gender preference options for user profiles.
 * Provides inclusive options for gender identification.
 */

export const GenderPreferenceEnum = {
  MALE: 'male',
  FEMALE: 'female',
  NON_BINARY: 'non-binary',
  OTHER: 'other',
  PREFER_NOT_TO_SAY: 'prefer-not-to-say',
} as const

/**
 * Notification channel preferences.
 * Defines the available communication channels for user notifications.
 */

export const NotificationPreferencesEnum = {
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
} as const

/**
 * Profile controller operations for type safety
 * Defines the different operations that can be performed on user profiles
 */

export const ProfileOperationEnum = {
  LOAD: 'loadProfile',
  UPDATE: 'updateProfile',
  UPLOAD: 'uploadAvatar',
  CREATE_IF_MISSING: 'createProfileIfMissing',
} as const

/**
 * Type representing gender preference values.
 * Derived from GenderPreferenceEnum for type safety.
 */
export type GenderPreference = (typeof GenderPreferenceEnum)[keyof typeof GenderPreferenceEnum]

/**
 * Type representing notification preference values.
 * Derived from NotificationPreferencesEnum for type safety.
 */
export type NotificationPreferences = (typeof NotificationPreferencesEnum)[keyof typeof NotificationPreferencesEnum]

/**
 * Props interface for profile form section components.
 * Provides react-hook-form integration and validation state.
 *
 * @example
 * ```typescript
 * function PersonalInfoSection({ control, errors, isSubmitting }: ProfileSectionProps) {
 *   // Component implementation
 * }
 * ```
 */
export interface ProfileSectionProps {
  control: Control<ProfileFormValues>
  errors: FieldErrors<ProfileFormValues>
  register?: UseFormRegister<ProfileFormValues>
  watch?: UseFormWatch<ProfileFormValues>
  isSubmitting?: boolean
  disabled?: boolean
}

/**
 * Geographic location data structure.
 * Represents a user's location at the country, state, and city level.
 */
export interface LocationData {
  /** Country name or ISO code */
  country: string
  /** State, province, or region */
  state: string
  /** City name */
  city: string
}

/**
 * User privacy settings and preferences.
 * Controls data sharing and communication preferences.
 *
 * Note: Cookie preferences are managed client-side via localStorage and are not stored in the database.
 *
 * @example
 * ```typescript
 * const privacy: PrivacySettings = {
 *   data_sharing: { third_parties: false, analytics: true, marketing: false },
 *   communication_preferences: { email: true, push: false, sms: false }
 * };
 * ```
 */
export interface PrivacySettings {
  /** Data sharing permissions */
  data_sharing?: {
    /** Allow sharing with third parties */
    third_parties?: boolean
    /** Allow analytics data collection */
    analytics?: boolean
    /** Allow marketing data usage */
    marketing?: boolean
  }
  /** Communication channel preferences */
  communication_preferences?: {
    /** Enable email communications */
    email?: boolean
    /** Enable push notifications */
    push?: boolean
    /** Enable SMS communications */
    sms?: boolean
  }
}

/**
 * Social media link configuration.
 * Represents a single social media profile or external link, with optional Open Graph metadata.
 *
 * @example
 * ```typescript
 * const link: SocialLink = {
 *   id: 'twitter-1',
 *   url: 'https://twitter.com/username',
 *   title: 'Twitter Profile',
 *   platform: 'twitter',
 *   metadata: {
 *     title: 'John Doe (@username) / X',
 *     description: 'Developer, builder, dreamer.',
 *     image: 'https://pbs.twimg.com/profile_images/1234567890/abcd_normal.jpg',
 *   }
 * };
 * ```
 *
 * @remarks
 * The full OG metadata is stored in the `metadata` field, which is persisted as part of the JSON array in DbProfile.social_links.
 * This allows the UI to render rich previews without additional fetches.
 */
export type SocialLink = {
  /** Unique identifier for this link */
  id: string
  /** Full URL to the social profile or website */
  url: string
  /** Display title or label for the link */
  title: string
  /** Platform key (e.g., 'twitter', 'github', 'linkedin', 'website') */
  platform?: string
  /** Open Graph metadata for link preview */
  metadata?: {
    title?: string
    description?: string
    image?: string
    fetchedAt?: string
    ttl?: number
  }
}

/**
 * User status options
 */

export const UserStatusEnum = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const
export type UserStatus = (typeof UserStatusEnum)[keyof typeof UserStatusEnum]

/**
 * User status filter options (including ALL)
 */

export const UserStatusFilterEnum = {
  ALL: 'all',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  PENDING: 'pending',
} as const
export type UserStatusFilter = (typeof UserStatusFilterEnum)[keyof typeof UserStatusFilterEnum]

/**
 * Collection of social media links.
 * Array of SocialLink objects for multiple social profiles.
 */
export type SocialLinks = SocialLink[]
