/**
 * Profile Utility Functions
 *
 * Provides conversion utilities between database and application profile types.
 * Handles JSON field parsing, type validation, and default value management.
 */

import { type Json } from '../../types/supabase'

import { DbUserRoleEnum, UserRoleEnum, type DbUserRole, type UserRole } from '@/types/admin.types'
import { AuthProvidersEnum, type AuthProvider } from '@/types/auth.types'

import { type DbProfile, type DbProfileInsert, type DbProfileUpdate } from '@/types/database'

import {
  GenderPreferenceEnum,
  NotificationPreferencesEnum,
  UserStatusEnum,
  type GenderPreference,
  type NotificationPreferences,
  type PrivacySettings,
  type Profile,
  type ProfileUpdate,
  type ProviderInfo,
  type SocialLink,
  type SocialLinks,
  type UserStatus,
} from '@/types/profile.types'
import { ThemePreferenceEnum, type ThemePreference } from '@/types/theme.types'
import { SOCIAL_PLATFORMS } from '@/config/social'
import { isPrivateNetworkUrl, isSecureUrl, isValidUrl } from '@/lib/utils/string-utils'

/**
 * Checks if a given avatar URL is safe for use (prevents SSRF).
 * - Must be HTTPS
 * - Must not be localhost or private/internal IP
 * - Optionally, can restrict to known CDN hostnames
 *
 * @param urlString The avatar URL to validate
 * @param allowedHosts Optional array of allowed hostnames (CDNs)
 * @returns The sanitized URL string if valid, otherwise null
 */
export function isValidAvatarUrl(urlString: string | null | undefined, allowedHosts?: string[]): string | null {
  if (!urlString) return null
  if (!isValidUrl(urlString)) return null
  if (!isSecureUrl(urlString)) return null
  if (isPrivateNetworkUrl(urlString)) return null

  let url: URL
  try {
    url = new URL(urlString)
  } catch {
    return null
  }

  // Optionally, enforce allowlist
  if (allowedHosts && allowedHosts.length > 0 && !allowedHosts.includes(url.hostname)) return null

  return url.toString()
}

/**
 * Validates a social link URL against security requirements and allowed hostnames.
 *
 * Security checks:
 * - Must be a valid URL
 * - Must be HTTPS protocol
 * - Blocks localhost and private/internal IPs
 *
 * Business rules:
 * - Platform must exist in SOCIAL_PLATFORMS
 * - 'website' accepts any HTTPS URL
 * - Other platforms must match an allowed hostname
 *
 * @param url - The URL string to validate
 * @param platform - The social platform key
 * @returns true if the URL is valid and safe, false otherwise
 */
export function isValidSocialUrl(url: string, platform: string): boolean {
  if (!isValidUrl(url)) return false
  if (!isSecureUrl(url)) return false
  if (isPrivateNetworkUrl(url)) return false

  try {
    const parsedUrl = new URL(url)
    const platformConfig = SOCIAL_PLATFORMS.find((p) => p.key === platform)
    if (!platformConfig) return false

    if (platformConfig.key === 'website') return true

    return platformConfig.hostnames.some((hostname) => parsedUrl.hostname.endsWith(hostname))
  } catch {
    return false
  }
}

/**
 * Default privacy settings applied to new profiles.
 * Follows a privacy-first approach with conservative defaults.
 *
 * Note: Cookie preferences are managed client-side via localStorage.
 *
 * @constant
 */
export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
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

  const settings = privacySettings as Partial<PrivacySettings>

  return {
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
 * Convert database user role to application user role.
 * Validates the role exists in the database enum and provides fallback.
 *
 * @param role - Raw role value from database
 * @returns Validated application UserRole (never returns 'guest' since it's not in DB)
 * @internal
 *
 * @remarks
 * Database roles: 'user' | 'moderator' | 'admin' | 'root'
 * Application roles: 'guest' | 'user' | 'moderator' | 'admin' | 'root'
 * The 'guest' role is application-only for unauthenticated users.
 */
const convertDbUserRole = (role?: string | null): Exclude<UserRole, 'guest'> => {
  if (!role) return UserRoleEnum.USER

  // Validate against database role enum values
  const validDbRoles: string[] = Object.values(DbUserRoleEnum)
  return validDbRoles.includes(role) ? (role as DbUserRole) : UserRoleEnum.USER
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
 * Validates structure and filters out invalid entries, preserving all fields.
 *
 * @param links - Raw social links from database (JSON array)
 * @returns Typed and validated SocialLinks array with all fields preserved
 * @internal
 */
const convertDbSocialLinks = (links?: unknown): SocialLinks => {
  if (!Array.isArray(links)) return []

  return links.reduce<SocialLink[]>((acc, item) => {
    if (item !== null && typeof item === 'object' && 'id' in item && 'url' in item && 'title' in item) {
      const link = item as {
        id: unknown
        url: unknown
        title: unknown
        platform?: unknown
        metadata?: unknown
      }
      if (typeof link.id === 'string' && typeof link.url === 'string' && typeof link.title === 'string') {
        const socialLink: SocialLink = {
          id: link.id,
          url: link.url,
          title: link.title,
        }

        // Preserve platform if present and valid string
        if (typeof link.platform === 'string') {
          socialLink.platform = link.platform
        }

        // Preserve metadata if present and valid object
        if (link.metadata !== null && typeof link.metadata === 'object') {
          const meta = link.metadata as Record<string, unknown>
          socialLink.metadata = {
            title: typeof meta.title === 'string' ? meta.title : undefined,
            description: typeof meta.description === 'string' ? meta.description : undefined,
            image: typeof meta.image === 'string' ? meta.image : undefined,
          }
        }

        acc.push(socialLink)
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
    role,
    status,
    providers,
    created_at,
    confirmed_at,
    last_sign_in_at,
    banned_until,
    theme,
    ...rest
  } = dbProfile

  return {
    ...rest,
    privacy_settings: convertDbPrivacySettings(dbPrivacySettings),
    gender: convertDbGenderPreference(dbGender),
    notification_preferences: convertDbNotificationPreferences(dbNotificationPrefs),
    social_links: convertDbSocialLinks(dbSocialLinks),
    // Convert database role to application role (validates and provides fallback)
    role: convertDbUserRole(role),
    status: (status as UserStatus) || UserStatusEnum.ACTIVE,
    theme: (theme as ThemePreference) || 'system',
    // Auth-synced fields (read-only, managed by background jobs)
    providers: (providers ?? []) as AuthProvider[],
    created_at,
    confirmed_at,
    last_sign_in_at,
    banned_until,
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
 * Convert application user role to database user role.
 * Filters out 'guest' role which is application-only.
 *
 * @param role - Application UserRole
 * @returns Database-compatible DbUserRole or undefined if guest/invalid
 * @internal
 *
 * @remarks
 * The 'guest' role is application-only and cannot be stored in the database.
 * Guest users are not represented in the profiles table.
 *
 * @example
 * ```typescript
 * convertAppUserRole('guest')     // returns undefined
 * convertAppUserRole('user')      // returns 'user'
 * convertAppUserRole('admin')     // returns 'admin'
 * ```
 */
const convertAppUserRole = (role?: UserRole | null): DbUserRole | undefined => {
  if (!role || role === UserRoleEnum.GUEST) return undefined

  // Validate against database role enum values
  const validDbRoles: string[] = Object.values(DbUserRoleEnum)
  return validDbRoles.includes(role) ? (role as DbUserRole) : undefined
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
 * Ensures proper structure for database storage, preserving all fields.
 *
 * @param links - Application SocialLinks array
 * @returns Database-compatible array of link objects with all fields preserved
 * @internal
 */
const convertAppSocialLinks = (links: SocialLinks): SocialLinks => {
  if (!Array.isArray(links)) return []

  return links.map((link) => {
    const result: SocialLink = {
      id: link.id,
      url: link.url,
      title: link.title,
    }

    if (link.platform !== undefined) result.platform = link.platform
    if (link.metadata !== undefined) result.metadata = link.metadata

    return result
  })
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
  const { privacy_settings, gender, notification_preferences, social_links, display_name, email, role, ...rest } =
    appProfile

  return {
    ...rest,
    display_name: display_name ?? '', // Required field with default
    email: email ?? '', // Required field with default
    theme: appProfile.theme ?? ThemePreferenceEnum.SYSTEM,
    role: convertAppUserRole(role),
    privacy_settings: convertAppPrivacySettings(privacy_settings),
    gender: convertAppGenderPreference(gender),
    notification_preferences: convertAppNotificationPreferences(notification_preferences),
    social_links: convertAppSocialLinks(social_links ?? []),
  }
}

/**
 * Convert an application profile to database format for update operations.
 * All fields are optional for partial updates.
 * Excludes auth-synced fields (created_at, confirmed_at, last_sign_in_at, banned_until, providers).
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
  const {
    privacy_settings,
    gender,
    notification_preferences,
    social_links,
    display_name,
    email,
    role,
    avatar_url,
    bio,
    birth_date,
    city,
    company,
    country_code,
    first_name,
    is_onboarded,
    job_title,
    last_name,
    locale,
    phone,
    state,
    status,
    timezone,
    website,
  } = appProfile as Partial<Profile>

  return {
    avatar_url,
    bio,
    birth_date,
    city,
    company,
    country_code,
    display_name,
    email,
    first_name,
    is_onboarded,
    job_title,
    last_name,
    locale,
    phone,
    state,
    status,
    timezone,
    website,
    role: convertAppUserRole(role),
    privacy_settings: privacy_settings ? convertAppPrivacySettings(privacy_settings) : undefined,
    gender: convertAppGenderPreference(gender),
    notification_preferences: notification_preferences
      ? convertAppNotificationPreferences(notification_preferences)
      : undefined,
    social_links: social_links ? convertAppSocialLinks(social_links) : undefined,
    theme: appProfile.theme,
  }
}

/**
 * Get a human-readable provider name.
 *
 * @param provider - Provider identifier (e.g., 'email', 'google', 'github')
 * @returns Display name for the provider
 *
 * @example
 * ```typescript
 * getProviderDisplayName(AuthProvidersEnum.GOOGLE) // Returns: 'Google'
 * getProviderDisplayName(AuthProvidersEnum.EMAIL) // Returns: 'Email'
 * ```
 */
export function getProviderDisplayName(provider: AuthProvider): string {
  const providerNames: Record<AuthProvider, string> = {
    [AuthProvidersEnum.EMAIL]: 'Email',
    [AuthProvidersEnum.GOOGLE]: 'Google',
    [AuthProvidersEnum.GITHUB]: 'GitHub',
    [AuthProvidersEnum.FACEBOOK]: 'Facebook',
    [AuthProvidersEnum.TWITTER]: 'Twitter',
    [AuthProvidersEnum.MICROSOFT]: 'Microsoft',
    [AuthProvidersEnum.APPLE]: 'Apple',
    [AuthProvidersEnum.DISCORD]: 'Discord',
    [AuthProvidersEnum.GITLAB]: 'GitLab',
    [AuthProvidersEnum.BITBUCKET]: 'Bitbucket',
    [AuthProvidersEnum.SLACK]: 'Slack',
    [AuthProvidersEnum.SPOTIFY]: 'Spotify',
    [AuthProvidersEnum.TWITCH]: 'Twitch',
    [AuthProvidersEnum.LINKEDIN]: 'LinkedIn',
    [AuthProvidersEnum.NOTION]: 'Notion',
    [AuthProvidersEnum.ZOOM]: 'Zoom',
    [AuthProvidersEnum.WORKOS]: 'WorkOS',
  }

  return providerNames[provider] || provider.charAt(0).toUpperCase() + provider.slice(1)
}

/**
 * Check if a profile has a specific authentication provider.
 *
 * @param profile - User profile
 * @param provider - Provider identifier to check
 * @returns True if the user has authenticated with this provider
 *
 * @example
 * ```typescript
 * if (hasProvider(profile, AuthProvidersEnum.GOOGLE)) {
 *   console.log('User has Google authentication')
 * }
 * ```
 */
export function hasProvider(profile: Profile, provider: AuthProvider): boolean {
  return profile.providers?.includes(provider) ?? false
}

/**
 * Get all authentication providers for a profile with display names.
 *
 * @param profile - User profile
 * @returns Array of provider objects with id and display name
 *
 * @example
 * ```typescript
 * const providers = getProviderList(profile)
 * // Returns: [{ id: 'email', name: 'Email' }, { id: 'google', name: 'Google' }]
 * ```
 */
export function getProviderList(profile: Profile): ProviderInfo[] {
  if (!profile.providers || profile.providers.length === 0) {
    return []
  }

  return profile.providers.map((provider: AuthProvider) => ({
    id: provider,
    name: getProviderDisplayName(provider),
  }))
}

/**
 * Return type for getUserBadges function.
 * Contains badge data for users with elevated roles.
 */
export type GetUserBadgesReturn = {
  role: UserRole
  status: UserStatus
  identities: AuthProvider[]
}

/**
 * Get user badge data for elevated roles (moderator, admin, root).
 * Returns role, status, and identity providers for display as badges.
 *
 * @param profile - User profile
 * @returns Badge data object or undefined if user has no elevated role
 *
 * @example
 * ```typescript
 * const badgeData = getUserBadges(profile)
 * if (badgeData) {
 *   // { role: 'admin', status: 'active', identities: ['email', 'google'] }
 * }
 * ```
 */
export function getUserBadges(profile: Profile): GetUserBadgesReturn | undefined {
  const elevatedRoles: UserRole[] = [UserRoleEnum.MODERATOR, UserRoleEnum.ADMIN, UserRoleEnum.ROOT]

  if (!elevatedRoles.includes(profile.role)) {
    return undefined
  }

  return {
    role: profile.role,
    status: profile.status,
    identities: profile.providers,
  }
}
