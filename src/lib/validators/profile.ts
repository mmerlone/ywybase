/**
 * Profile Form Validators
 *
 * Zod schemas for validating user profile forms.
 * Handles validation for profile creation, updates, and field-specific rules.
 */

import moment from 'moment-timezone'
import { z } from 'zod'

import { GenderPreference } from '@/types'
import { Profile } from '@/types/database'
import { GenderPreferenceEnum } from '@/types/profile.types'

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
  id: z.string().uuid().optional(),
  email: z.string().email('Invalid email address'),
  display_name: z
    .string()
    .trim()
    .min(1, 'Display name is required')
    .max(100, 'Display name must be less than 100 characters'),

  first_name: nullableString(100, 'First name'),
  last_name: nullableString(100, 'Last name'),
  phone: z
    .string()
    .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/, {
      message: 'Please enter a valid phone number',
    })
    .or(z.literal(''))
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  bio: nullableString(500, 'Bio'),
  company: nullableString(100, 'Company'),
  job_title: nullableString(100, 'Job title'),
  website: z
    .string()
    .url('Please enter a valid URL')
    .or(z.literal(''))
    .nullable()
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  timezone: nullableString(50, 'Timezone'),
  country_code: nullableString(10, 'Country code'),
  state: nullableString(100, 'State'),
  city: nullableString(100, 'City'),
  locale: nullableString(10, 'Locale'),

  avatar_url: z.string().url('Please enter a valid URL').or(z.literal('')).nullable().optional(),
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
    .enum([
      GenderPreferenceEnum.MALE,
      GenderPreferenceEnum.FEMALE,
      GenderPreferenceEnum.NON_BINARY,
      GenderPreferenceEnum.OTHER,
      GenderPreferenceEnum.PREFER_NOT_TO_SAY,
    ])
    .transform((val): GenderPreference | null => {
      if (val === null || val === undefined) return null
      return val
    })
    .nullable()
    .optional(),
} as const) satisfies z.ZodType<ProfileFormFields>

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
