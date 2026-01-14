/**
 * Profile Types
 *
 * Type definitions for user profile management.
 * Includes profile data structures, form types, and preferences.
 */

import { Control, FieldErrors, UseFormRegister, UseFormWatch } from 'react-hook-form'

import { CookiePreferences } from './cookie.types'
import { Profile, ProfileUpdate, ProfileInsert } from './database'

import { ProfileFormValues } from '@/lib/validators'

// Base Profile types from database
export type { Profile }
export type { ProfileUpdate }
export type { ProfileInsert }

/**
 * Gender preference options for user profiles.
 * Provides inclusive options for gender identification.
 */
export enum GenderPreferenceEnum {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

/**
 * Notification channel preferences.
 * Defines the available communication channels for user notifications.
 */
export enum NotificationPreferencesEnum {
  /** Email notifications */
  EMAIL = 'email',
  /** SMS/text message notifications */
  SMS = 'sms',
  /** Push notifications */
  PUSH = 'push',
}

/**
 * Profile controller operations for type safety
 * Defines the different operations that can be performed on user profiles
 */
export enum ProfileOperationEnum {
  LOAD = 'loadProfile',
  UPDATE = 'updateProfile',
  UPLOAD = 'uploadAvatar',
  CREATE_IF_MISSING = 'createProfileIfMissing',
}

/**
 * Type representing gender preference values.
 * Derived from GenderPreferenceEnum for type safety.
 */
export type GenderPreference = `${GenderPreferenceEnum}`

/**
 * Type representing notification preference values.
 * Derived from NotificationPreferencesEnum for type safety.
 */
export type NotificationPreferences = `${NotificationPreferencesEnum}`

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
 * Controls data sharing, cookies, and communication preferences.
 *
 * @example
 * ```typescript
 * const privacy: PrivacySettings = {
 *   cookie_preferences: { necessary: true, analytics: true, marketing: false, functional: true },
 *   data_sharing: { third_parties: false, analytics: true, marketing: false },
 *   communication_preferences: { email: true, push: false, sms: false }
 * };
 * ```
 */
export interface PrivacySettings {
  /** Cookie consent preferences */
  cookie_preferences?: CookiePreferences
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
 * Represents a single social media profile or external link.
 *
 * @example
 * ```typescript
 * const link: SocialLink = {
 *   id: 'twitter-1',
 *   url: 'https://twitter.com/username',
 *   title: 'Twitter Profile'
 * };
 * ```
 */
export type SocialLink = {
  /** Unique identifier for this link */
  id: string
  /** Full URL to the social profile or website */
  url: string
  /** Display title or label for the link */
  title: string
}

/**
 * Collection of social media links.
 * Array of SocialLink objects for multiple social profiles.
 */
export type SocialLinks = SocialLink[]
