/**
 * Common Validation Schemas
 *
 * Reusable Zod schemas for common fields used across multiple forms.
 * Includes email and password validation with configurable requirements.
 */

import { z } from 'zod'

import { SITE_CONFIG } from '@/config/site'

const {
  passwordRequirements: {
    minLength,
    requireUppercase,
    requireLowercase,
    requireNumber,
    requireSpecialChar,
    specialChars,
  },
} = SITE_CONFIG

/**
 * Email validation schema.
 * Validates email format, length constraints, and normalizes to lowercase.
 *
 * @remarks
 * - Validates proper email format
 * - Minimum 5 characters, maximum 255 characters
 * - Automatically converts to lowercase and trims whitespace
 *
 * @example
 * ```typescript
 * const result = emailSchema.parse('User@Example.com');
 * // Returns: 'user@example.com'
 * ```
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email cannot be longer than 255 characters')
  .toLowerCase()
  .trim()

/**
 * Password validation schema.
 * Enforces password strength requirements based on site configuration.
 *
 * @remarks
 * Validates based on SITE_CONFIG.passwordRequirements:
 * - Minimum length (configurable, default varies)
 * - Uppercase letter (if required)
 * - Lowercase letter (if required)
 * - Number (if required)
 * - Special character (if required)
 *
 * @example
 * ```typescript
 * const result = passwordSchema.parse('SecurePass123!');
 * // Returns valid password if it meets all requirements
 * ```
 */
export const passwordSchema = z
  .string()
  .min(minLength, `Password must be at least ${minLength} characters`)
  .max(100, 'Password cannot be longer than 100 characters')
  .refine((value) => !requireUppercase || /[A-Z]/.test(value), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((value) => !requireLowercase || /[a-z]/.test(value), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((value) => !requireNumber || /\d/.test(value), {
    message: 'Password must contain at least one number',
  })
  .refine(
    (value) =>
      !requireSpecialChar || new RegExp(`[${specialChars.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}]`).test(value),
    {
      message: `Password must contain at least one special character (${specialChars})`,
    }
  )
