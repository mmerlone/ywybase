/**
 * Profile Form Validators
 *
 * Zod schemas for validating user profile forms.
 * Handles validation for profile creation, updates, and field-specific rules.
 */

import moment from 'moment-timezone'
import { z } from 'zod'
import { isValidSocialUrl } from '@/lib/utils/profile-utils'
import { privacySettingsSchema } from './privacy'

import { MAX_SOCIAL_LINKS } from '@/config/social'
import { GenderPreferenceEnum, SocialProvidersEnum, type GenderPreference, type Profile } from '@/types/profile.types'
import { ThemePreferenceEnum, type ThemePreference } from '@/types/theme.types'

/**
 * Phone number regex pattern for validation.
 * Accepts international phone numbers with optional + prefix,
 * spaces, parentheses, hyphens, and dots.
 * Minimum 8 characters, maximum 25 characters.
 */
export const PHONE_REGEX = /^\+?[0-9\s\(\)\-\.]{8,25}$/

/**
 * Field length constraints for profile form fields.
 * Single source of truth for all field max lengths.
 */
export const PROFILE_FIELD_LIMITS = {
  /** Maximum length for bio field in characters */
  BIO_MAX_LENGTH: 1000,
  /** Maximum length for display name in characters */
  DISPLAY_NAME_MAX_LENGTH: 100,
  /** Maximum length for first/last name in characters */
  NAME_MAX_LENGTH: 100,
  /** Maximum length for company/job title in characters */
  COMPANY_MAX_LENGTH: 100,
  /** Maximum length for timezone in characters */
  TIMEZONE_MAX_LENGTH: 50,
  /** Maximum length for country code in characters */
  COUNTRY_CODE_MAX_LENGTH: 10,
  /** Maximum length for state in characters */
  STATE_MAX_LENGTH: 100,
  /** Maximum length for city in characters */
  CITY_MAX_LENGTH: 100,
  /** Maximum length for locale in characters */
  LOCALE_MAX_LENGTH: 10,
} as const

/**
 * Type representing the subset of Profile fields used in forms.
 * Excludes server-managed fields and complex nested objects.
 */
type ProfileFormFields = Partial<
  Pick<
    Profile,
    | 'id'
    | 'email'
    | 'display_name'
    | 'first_name'
    | 'last_name'
    | 'phone'
    | 'bio'
    | 'company'
    | 'job_title'
    | 'website'
    | 'timezone'
    | 'country_code'
    | 'state'
    | 'city'
    | 'locale'
    | 'avatar_url'
    | 'birth_date'
    | 'gender'
  >
>

/**
 * Helper function to create a nullable string schema with length validation.
 * Transforms empty strings to null for database compatibility.
 *
 * @param maxLength - Maximum allowed string length (default: 255)
 * @param fieldName - Name of the field for error messages (default: 'Field')
 * @returns Zod schema for nullable string with specified constraints
 *
 * @example
 * ```typescript
 * const nameSchema = nullableString(100, 'Name');
 * nameSchema.parse(''); // Returns: null
 * nameSchema.parse('John'); // Returns: 'John'
 * ```
 */
const nullableString = (maxLength = 255, fieldName = 'Field'): z.ZodType<string | null | undefined> =>
  z
    .string()
    .trim()
    .max(maxLength, {
      message: `${fieldName} must be less than ${maxLength} characters`,
    })
    .transform((val) => (val === '' ? null : val))
    .nullable()
    .optional()

/**
 * Complete profile form validation schema.
 * Validates all profile fields with appropriate constraints and transformations.
 *
 * @remarks
 * Field-specific validation:
 * - email: Required, valid email format
 * - display_name: Required, 1-100 characters
 * - phone: Optional, validates international phone number format
 * - website: Optional, must be valid URL
 * - birth_date: Optional, validates YYYY-MM-DD format
 * - gender: Optional, enum validation
 * - All other text fields: Optional, nullable with max length limits
 *
 * @example
 * ```typescript
 * const profile = profileFormSchema.parse({
 *   email: 'user@example.com',
 *   display_name: 'John Doe',
 *   first_name: 'John',
 *   last_name: 'Doe',
 *   timezone: 'America/New_York'
 * });
 * ```
 */
export const profileFormSchema = z.object({
  id: z.uuid({ error: 'Invalid UUID format' }).optional(),
  email: z.email({ error: 'Invalid email address' }),
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(
      PROFILE_FIELD_LIMITS.DISPLAY_NAME_MAX_LENGTH,
      `Display name must be less than ${PROFILE_FIELD_LIMITS.DISPLAY_NAME_MAX_LENGTH} characters`
    ),

  first_name: nullableString(PROFILE_FIELD_LIMITS.NAME_MAX_LENGTH, 'First name'),
  last_name: nullableString(PROFILE_FIELD_LIMITS.NAME_MAX_LENGTH, 'Last name'),
  phone: z
    .string()
    .regex(PHONE_REGEX, {
      message: 'Please enter a valid phone number',
    })
    .or(z.literal(''))
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  bio: nullableString(PROFILE_FIELD_LIMITS.BIO_MAX_LENGTH, 'Bio'),
  company: nullableString(PROFILE_FIELD_LIMITS.COMPANY_MAX_LENGTH, 'Company'),
  job_title: nullableString(PROFILE_FIELD_LIMITS.COMPANY_MAX_LENGTH, 'Job title'),
  website: z
    .url({ error: 'Please enter a valid URL' })
    .or(z.literal(''))
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  timezone: nullableString(PROFILE_FIELD_LIMITS.TIMEZONE_MAX_LENGTH, 'Timezone'),
  country_code: nullableString(PROFILE_FIELD_LIMITS.COUNTRY_CODE_MAX_LENGTH, 'Country code'),
  state: nullableString(PROFILE_FIELD_LIMITS.STATE_MAX_LENGTH, 'State'),
  city: nullableString(PROFILE_FIELD_LIMITS.CITY_MAX_LENGTH, 'City'),
  locale: nullableString(PROFILE_FIELD_LIMITS.LOCALE_MAX_LENGTH, 'Locale'),

  avatar_url: z.url({ error: 'Please enter a valid URL' }).or(z.literal('')).nullable().optional(),
  birth_date: z
    .string()
    .nullable()
    .refine((val) => val === null || val === undefined || moment(val, 'YYYY-MM-DD', true).isValid(), {
      message: 'Invalid date format. Please use YYYY-MM-DD',
    })
    .transform((val) => {
      if (val === null || val === undefined) return null
      return moment(val, 'YYYY-MM-DD').format('YYYY-MM-DD')
    }),
  gender: z
    .enum(GenderPreferenceEnum, {
      error: 'Invalid gender preference',
    })
    .transform((val): GenderPreference | null => {
      if (val === null || val === undefined) return null
      return val as GenderPreference
    })
    .nullable()
    .optional(),
  theme: z.enum(ThemePreferenceEnum).default(ThemePreferenceEnum.SYSTEM) as z.ZodType<ThemePreference>,
  privacy_settings: privacySettingsSchema.nullable().optional(),
} as const) satisfies z.ZodType<ProfileFormFields & { theme?: ThemePreference }>

/**
 * Inferred TypeScript type for profile form values.
 * Derived from the profileFormSchema validation schema.
 */
export type ProfileFormValues = z.infer<typeof profileFormSchema>

/**
 * Profile update validation schema.
 * All fields are optional and partial, excluding the immutable id field.
 *
 * @remarks
 * Used for updating existing profiles where only changed fields need validation.
 *
 * @example
 * ```typescript
 * const update = profileUpdateSchema.parse({
 *   display_name: 'New Name',
 *   bio: 'Updated bio'
 * });
 * ```
 */
export const profileUpdateSchema = profileFormSchema
  .omit({
    id: true,
  })
  .partial()

/**
 * Inferred TypeScript type for profile update data.
 */
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

/**
 * Profile creation validation schema.
 * All fields except id are required as per the base schema.
 *
 * @remarks
 * Used when creating new profiles where id will be auto-generated.
 *
 * @example
 * ```typescript
 * const newProfile = profileCreateSchema.parse({
 *   email: 'newuser@example.com',
 *   display_name: 'New User'
 * });
 * ```
 */
export const profileCreateSchema = profileFormSchema.omit({
  id: true,
})

/**
 * Inferred TypeScript type for profile creation data.
 */
export type ProfileCreateData = z.infer<typeof profileCreateSchema>
/**
 * Avatar file validation constraints.
 * Defines size limits and allowed file types for avatar uploads.
 *
 * @constant
 * @example
 * ```typescript
 * // Check if file is valid
 * if (file.size > AVATAR_VALIDATION.maxSize) {
 *   throw new Error('File too large')
 * }
 * ```
 */
export const AVATAR_VALIDATION = {
  /** Maximum file size in bytes (5MB) */
  maxSize: 5 * 1024 * 1024,
  /** Allowed MIME types */
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  /** Allowed file extensions */
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
} as const

/**
 * Zod schema for validating avatar file uploads.
 * Validates file size, type, and extension.
 *
 * @example
 * ```typescript
 * const result = avatarFileSchema.safeParse(file)
 * if (!result.success) {
 *   console.error('Invalid avatar:', result.error.issues)
 * }
 * ```
 */
export const avatarFileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= AVATAR_VALIDATION.maxSize, {
    message: `File size must be less than ${AVATAR_VALIDATION.maxSize / 1024 / 1024}MB`,
  })
  .refine((file) => (AVATAR_VALIDATION.allowedTypes as readonly string[]).includes(file.type), {
    message: `File type must be one of: ${AVATAR_VALIDATION.allowedTypes.join(', ')}`,
  })
  .refine(
    (file) => {
      const ext = `.${file.name.split('.').pop()?.toLowerCase()}`
      return (AVATAR_VALIDATION.allowedExtensions as readonly string[]).includes(ext)
    },
    {
      message: `File extension must be one of: ${AVATAR_VALIDATION.allowedExtensions.join(', ')}`,
    }
  )

/**
 * Validates a URL against platform-specific hostname requirements.
 * For social platforms: checks URL hostname against allowed hostnames in SOCIAL_PLATFORMS.
 * For 'website': accepts any https URL.
 *
 * @param url - The URL to validate
 * @param platform - The social platform key
 * @returns true if valid, false otherwise
 */

/**
 * Zod schema for validating a single social link.
 * Validates platform, URL (https-only), hostname matching, title, and metadata structure.
 *
 * @example
 * ```typescript
 * const link = socialLinkSchema.parse({
 *   id: '123e4567-e89b-12d3-a456-426614174000',
 *   url: 'https://github.com/username',
 *   title: 'GitHub Profile',
 *   platform: 'github',
 *   metadata: {
 *     title: 'Username - GitHub',
 *     description: 'Open source projects',
 *     image: 'https://avatars.githubusercontent.com/...'
 *   }
 * })
 * ```
 */
export const socialLinkSchema = z
  .object({
    /** Unique identifier for this link (UUID v4) */
    id: z.uuid({ error: 'Invalid ID format' }),
    /** Full HTTPS URL to the social profile or website */
    url: z.url({ error: 'Invalid URL format' }).startsWith('https://', 'Must be HTTPS URL'),
    /** Display title or label for the link (1-100 characters) */
    title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').trim(),
    /** Platform key (must match a key in SOCIAL_PLATFORMS config) */
    platform: z.enum(SocialProvidersEnum, {
      error: 'Invalid platform',
    }),
    /** Open Graph metadata for link preview (optional) */
    metadata: z
      .object({
        title: z.string().optional(),
        description: z.string().optional(),
        image: z.url({ error: 'Invalid image URL' }).optional(),
        fetchedAt: z.iso.datetime({ error: 'Invalid datetime' }).optional(),
        ttl: z.number().int().positive().optional(),
      })
      .optional(),
  })
  .refine((data) => isValidSocialUrl(data.url, data.platform), {
    message: 'URL does not match platform hostname requirements',
    path: ['url'],
  })

/**
 * Inferred TypeScript type for a validated social link.
 */
export type SocialLinkData = z.infer<typeof socialLinkSchema>

/**
 * Zod schema for validating an array of social links.
 * Enforces max 10 links and one link per platform constraint.
 *
 * @example
 * ```typescript
 * const links = socialLinksArraySchema.parse([
 *   { id: '...', url: 'https://github.com/user', title: 'GitHub', platform: 'github' },
 *   { id: '...', url: 'https://twitter.com/user', title: 'Twitter', platform: 'twitter' }
 * ])
 * ```
 */
export const socialLinksArraySchema = z
  .array(socialLinkSchema)
  .max(MAX_SOCIAL_LINKS, `Maximum ${MAX_SOCIAL_LINKS} social links allowed`)
  .refine(
    (links) => {
      const platforms = links.map((link) => link.platform)
      return platforms.length === new Set(platforms).size
    },
    {
      message: 'Only one link per platform allowed',
    }
  )

/**
 * Inferred TypeScript type for a validated array of social links.
 */
export type SocialLinksArrayData = z.infer<typeof socialLinksArraySchema>

/**
 * Zod schema for validating social link form input (add/edit forms).
 * Used for UI-level validation before submitting to server.
 *
 * @example
 * ```typescript
 * const formData = socialLinkFormSchema.parse({
 *   platform: 'github',
 *   url: 'https://github.com/username',
 *   title: 'My GitHub'
 * })
 * ```
 */
export const socialLinkFormSchema = z.object({
  /** Platform key (must match a key in SOCIAL_PLATFORMS config) */
  platform: z.enum(SocialProvidersEnum, {
    error: 'Invalid platform',
  }),
  /** Full HTTPS URL to the social profile or website */
  url: z.url({ error: 'Invalid URL format' }).startsWith('https://', 'Must be HTTPS URL'),
  /** Display title or label for the link (1-100 characters) */
  title: z.string().min(1, 'Title is required').max(100, 'Title must be less than 100 characters').trim(),
})

/**
 * Inferred TypeScript type for social link form data.
 */
export type SocialLinkFormData = z.infer<typeof socialLinkFormSchema>

// Re-export privacy validators for convenience
export type { PrivacySettings, DataSharing, CommunicationPreferences } from './privacy'
