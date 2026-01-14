/**
 * Privacy Settings Validators
 *
 * Zod schemas for validating user privacy and data sharing preferences.
 * Includes validation for cookie preferences, data sharing, and communication channels.
 */

import { z } from 'zod'

import { cookiePreferencesSchema } from './cookie'

/**
 * Schema for data sharing preferences.
 * Controls what data the user consents to share with third parties and for analytics.
 *
 * @remarks
 * All fields default to false for privacy-first approach.
 *
 * @example
 * ```typescript
 * const sharing = dataSharingSchema.parse({
 *   third_parties: false,
 *   analytics: true,
 *   marketing: false
 * });
 * ```
 */
export const dataSharingSchema = z
  .object({
    third_parties: z.boolean().default(false),
    analytics: z.boolean().default(false),
    marketing: z.boolean().default(false),
  })
  .default({})

/**
 * Schema for communication preferences.
 * Controls which communication channels the user has opted into.
 *
 * @remarks
 * All channels default to false, requiring explicit user opt-in.
 *
 * @example
 * ```typescript
 * const prefs = communicationPreferencesSchema.parse({
 *   email: true,
 *   push: false,
 *   sms: false
 * });
 * ```
 */
export const communicationPreferencesSchema = z
  .object({
    email: z.boolean().default(false),
    push: z.boolean().default(false),
    sms: z.boolean().default(false),
  })
  .default({})

/**
 * Schema for privacy settings.
 * Comprehensive validation for all user privacy preferences.
 *
 * @remarks
 * Matches the PrivacySettings interface from @/types/profile.types.
 * All fields are optional with sensible defaults for new users.
 *
 * @example
 * ```typescript
 * const privacy = privacySettingsSchema.parse({
 *   cookie_preferences: { necessary: true, analytics: true, marketing: false, functional: true },
 *   data_sharing: { third_parties: false, analytics: true, marketing: false },
 *   communication_preferences: { email: true, push: false, sms: false }
 * });
 * ```
 */
export const privacySettingsSchema = z
  .object({
    cookie_preferences: cookiePreferencesSchema.optional(),
    data_sharing: dataSharingSchema.optional(),
    communication_preferences: communicationPreferencesSchema.optional(),
  })
  .default({})

/**
 * Inferred TypeScript type for data sharing preferences.
 */
export type DataSharing = z.infer<typeof dataSharingSchema>

/**
 * Inferred TypeScript type for communication preferences.
 */
export type CommunicationPreferences = z.infer<typeof communicationPreferencesSchema>

/**
 * Inferred TypeScript type for complete privacy settings.
 */
export type PrivacySettings = z.infer<typeof privacySettingsSchema>
