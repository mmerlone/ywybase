/**
 * Cookie Preferences Validation Schema
 *
 * Zod schema for validating user cookie consent preferences.
 */

import { z } from 'zod'

/**
 * Cookie preferences validation schema.
 * Validates user consent for different types of cookies.
 *
 * @remarks
 * All fields are boolean values:
 * - necessary: Essential cookies (typically always true)
 * - analytics: Analytics and performance tracking cookies
 * - marketing: Marketing and advertising cookies
 * - functional: Enhanced functionality cookies
 *
 * @example
 * ```typescript
 * const preferences = cookiePreferencesSchema.parse({
 *   necessary: true,
 *   analytics: true,
 *   marketing: false,
 *   functional: true
 * });
 * ```
 */
export const cookiePreferencesSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  functional: z.boolean(),
})
