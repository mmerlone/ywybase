/**
 * Privacy Settings Validators
 *
 * Zod schemas for validating user privacy and data sharing preferences.
 * Includes validation for cookie preferences, data sharing, and communication channels.
 */

import { z } from 'zod'

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
    third_parties: z.boolean().optional(),
    analytics: z.boolean().optional(),
    marketing: z.boolean().optional(),
  })
  .optional()

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
    email: z.boolean().optional(),
    push: z.boolean().optional(),
    sms: z.boolean().optional(),
  })
  .optional()

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
 *   data_sharing: { third_parties: false, analytics: true, marketing: false },
 *   communication_preferences: { email: true, push: false, sms: false }
 * });
 * ```
 */
export const privacySettingsSchema = z
  .object({
    data_sharing: dataSharingSchema,
    communication_preferences: communicationPreferencesSchema,
  })
  .optional()

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
