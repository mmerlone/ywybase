/**
 * Profile Utility Functions
 *
 * Provides conversion utilities between database and application profile types.
 * Handles JSON field parsing, type validation, and default value management.
 */

import { Json } from '../../types/supabase'

import { DEFAULT_COOKIE_PREFERENCES } from './cookie-utils'

import type { DbProfile, DbProfileInsert, DbProfileUpdate } from '@/types/database'
import { GenderPreferenceEnum, NotificationPreferencesEnum } from '@/types/profile.types'
import type {
  GenderPreference,
  NotificationPreferences,
  PrivacySettings,
  Profile,
  ProfileUpdate,
  SocialLink,
  SocialLinks,
} from '@/types/profile.types'

/**
 * Default privacy settings applied to new profiles.
 * Follows a privacy-first approach with conservative defaults.
 *
 * @constant
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  cookie_preferences: DEFAULT_COOKIE_PREFERENCES,
  data_sharing: {
    third_parties: false,
    analytics: false,
    marketing: false,
  },
  communication_preferences: {
    email: true,
    push: false,
    sms: false,
  },
}

/**
 * Convert database privacy settings JSON to typed PrivacySettings object.
 * Applies defaults for missing or invalid fields.
 *
 * @param privacySettings - Raw privacy settings from database (JSON)
 * @returns Typed PrivacySettings object with defaults
 * @internal
 */
const convertDbPrivacySettings = (privacySettings?: unknown): PrivacySettings => {
  if (privacySettings === null || typeof privacySettings !== 'object') {
    return DEFAULT_PRIVACY_SETTINGS
  }

  const settings = privacySettings as unknown as Partial<PrivacySettings>

  return {
    cookie_preferences: settings.cookie_preferences || DEFAULT_COOKIE_PREFERENCES,
    data_sharing: {
      third_parties: settings.data_sharing?.third_parties ?? false,
      analytics: settings.data_sharing?.analytics ?? false,
      marketing: settings.data_sharing?.marketing ?? false,
    },
    communication_preferences: {
      email: settings.communication_preferences?.email ?? true,
      push: settings.communication_preferences?.push ?? false,
      sms: settings.communication_preferences?.sms ?? false,
    },
  }
}

/**
 * Convert database gender string to typed GenderPreference.
 * Validates against enum values and returns null for invalid entries.
 *
 * @param gender - Raw gender value from database
 * @returns Typed GenderPreference or null
 * @internal
 */
const convertDbGenderPreference = (gender?: string | null): GenderPreference | null => {
  if (gender === null || gender === undefined) return null

  // Validate against enum values
  const validGenders = Object.values(GenderPreferenceEnum) as string[]
  return validGenders.includes(gender) ? (gender as GenderPreference) : null
}

/**
 * Convert database notification preferences to typed NotificationPreferences.
 * Validates against enum values and returns null for invalid entries.
 *
 * @param prefs - Raw notification preferences from database
 * @returns Typed NotificationPreferences or null
 * @internal
 */
const convertDbNotificationPreferences = (prefs?: unknown): NotificationPreferences | null => {
  if (prefs === null || prefs === undefined) return null

  if (typeof prefs === 'string') {
    const validPrefs = Object.values(NotificationPreferencesEnum) as string[]
    return validPrefs.includes(prefs) ? (prefs as NotificationPreferences) : null
  }

  return null
}

/**
 * Convert database social links array to typed SocialLinks.
 * Validates structure and filters out invalid entries.
 *
 * @param links - Raw social links from database (JSON array)
 * @returns Typed and validated SocialLinks array
 * @internal
 */
const convertDbSocialLinks = (links?: unknown): SocialLinks => {
  if (!Array.isArray(links)) return []

  return links.reduce<SocialLink[]>((acc, item) => {
    if (item !== null && typeof item === 'object' && 'id' in item && 'url' in item && 'title' in item) {
      const link = item as { id: unknown; url: unknown; title: unknown }
      if (typeof link.id === 'string' && typeof link.url === 'string' && typeof link.title === 'string') {
        acc.push({
          id: link.id,
          url: link.url,
          title: link.title,
        })
      }
    }
    return acc
  }, [])
}

/**
 * Convert a database profile to an application profile.
 * Parses JSON fields and applies type safety with validation.
 *
 * @param dbProfile - Raw profile from database
 * @returns Typed Profile object with parsed fields
 *
 * @example
 * ```typescript
 * const dbProfile = await supabase.from('profiles').select('*').single();
 * const profile = convertDbProfile(dbProfile.data);
 * // profile.privacy_settings is now typed as PrivacySettings
 * ```
 */
export const convertDbProfile = (dbProfile: DbProfile): Profile => {
  const {
    privacy_settings: dbPrivacySettings,
    gender: dbGender,
    notification_preferences: dbNotificationPrefs,
    social_links: dbSocialLinks,
    ...rest
  } = dbProfile

  return {
    ...rest,
    privacy_settings: convertDbPrivacySettings(dbPrivacySettings),
    gender: convertDbGenderPreference(dbGender),
    notification_preferences: convertDbNotificationPreferences(dbNotificationPrefs),
    social_links: convertDbSocialLinks(dbSocialLinks),
  }
}

/**
 * Convert application privacy settings to database JSON format.
 * Serializes PrivacySettings to JSON string for database storage.
 *
 * @param privacySettings - Application PrivacySettings object
 * @returns JSON string for database storage
 * @internal
 */
const convertAppPrivacySettings = (privacySettings?: PrivacySettings | null): Json | null => {
  if (!privacySettings) return JSON.stringify(DEFAULT_PRIVACY_SETTINGS)
  return JSON.stringify(privacySettings)
}

/**
 * Convert application gender preference to database string format.
 * Validates against enum values.
 *
 * @param gender - Application GenderPreference
 * @returns Database-compatible string or null
 * @internal
 */
const convertAppGenderPreference = (gender?: GenderPreference | null): string | null => {
  if (!gender) return null

  // Validate against enum values
  const validGenders = Object.values(GenderPreferenceEnum) as string[]
  return validGenders.includes(gender) ? gender : null
}

/**
 * Convert application notification preferences to database string format.
 * Validates against enum values.
 *
 * @param prefs - Application NotificationPreferences
 * @returns Database-compatible string or null
 * @internal
 */
const convertAppNotificationPreferences = (prefs?: NotificationPreferences | null): string | null => {
  if (!prefs) return null

  const validPrefs = Object.values(NotificationPreferencesEnum) as string[]
  return validPrefs.includes(prefs) ? prefs : null
}

/**
 * Convert application social links to database JSON array format.
 * Ensures proper structure for database storage.
 *
 * @param links - Application SocialLinks array
 * @returns Database-compatible array of link objects
 * @internal
 */
const convertAppSocialLinks = (links: SocialLinks): Array<{ id: string; url: string; title: string }> => {
  if (!Array.isArray(links)) return []

  return links.map((link) => ({
    id: link.id,
    url: link.url,
    title: link.title,
  }))
}

/**
 * Convert an application profile to database format for insert operations.
 * Handles partial data by providing defaults for required fields.
 *
 * @param appProfile - Partial application Profile object
 * @returns DbProfileInsert ready for database insertion
 *
 * @example
 * ```typescript
 * const insertData = convertAppProfileForInsert({
 *   email: 'user@example.com',
 *   display_name: 'John Doe',
 *   privacy_settings: { ... }
 * });
 * await supabase.from('profiles').insert(insertData);
 * ```
 */
export const convertAppProfileForInsert = (appProfile: Partial<Profile>): DbProfileInsert => {
  const { privacy_settings, gender, notification_preferences, social_links, display_name, email, ...rest } = appProfile

  return {
    ...rest,
    display_name: display_name ?? '', // Required field with default
    email: email ?? '', // Required field with default
    privacy_settings: convertAppPrivacySettings(privacy_settings),
    gender: convertAppGenderPreference(gender),
    notification_preferences: convertAppNotificationPreferences(notification_preferences),
    social_links: convertAppSocialLinks(social_links || []),
  }
}

/**
 * Convert an application profile to database format for update operations.
 * All fields are optional for partial updates.
 *
 * @param appProfile - Partial ProfileUpdate object
 * @returns DbProfileUpdate ready for database update
 *
 * @example
 * ```typescript
 * const updateData = convertAppProfileForUpdate({
 *   display_name: 'Jane Doe',
 *   bio: 'Updated bio'
 * });
 * await supabase.from('profiles')
 *   .update(updateData)
 *   .eq('id', userId);
 * ```
 */
export const convertAppProfileForUpdate = (appProfile: Partial<ProfileUpdate>): DbProfileUpdate => {
  const { privacy_settings, gender, notification_preferences, social_links, display_name, email, ...rest } = appProfile

  return {
    ...rest,
    display_name, // Optional field
    email, // Optional field
    privacy_settings: privacy_settings ? convertAppPrivacySettings(privacy_settings) : undefined,
    gender: convertAppGenderPreference(gender),
    notification_preferences: notification_preferences
      ? convertAppNotificationPreferences(notification_preferences)
      : undefined,
    social_links: social_links ? convertAppSocialLinks(social_links) : undefined,
  }
}
