/**
 * Authentication Form Validators
 *
 * Zod schemas for validating authentication-related forms.
 * Provides validation for login, signup, password reset, and password update operations.
 */

import { z } from 'zod'

import { emailSchema, passwordSchema } from './common'

import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Login form validation schema.
 * Validates email and password fields for user authentication.
 *
 * @example
 * ```typescript
 * const result = loginSchema.parse({
 *   email: 'user@example.com',
 *   password: 'SecurePass123!'
 * });
 * ```
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
})

/**
 * Sign up form validation schema.
 * Validates all required fields for new user registration including
 * name, email, password confirmation, and terms acceptance.
 *
 * @remarks
 * - Validates password confirmation matches
 * - Requires explicit terms acceptance (must be true)
 * - Trims whitespace from name field
 *
 * @example
 * ```typescript
 * const result = signUpSchema.parse({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'SecurePass123!',
 *   confirmPassword: 'SecurePass123!',
 *   acceptTerms: true
 * });
 * ```
 */
export const signUpSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot be longer than 100 characters')
      .trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    acceptTerms: z.literal(true, {
      error: 'You must accept the terms and conditions',
    }),
    request: z.any().optional(), // Request object for PKCE cookie storage
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Forgot password email submission schema.
 * Validates the email address for password reset requests.
 *
 * @example
 * ```typescript
 * const result = forgotPasswordEmailSchema.parse({
 *   email: 'user@example.com'
 * });
 * ```
 */
export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
})

/**
 * Password reset form validation schema.
 * Validates new password and confirmation when resetting via email link.
 *
 * @remarks
 * Used after user clicks the password reset link from their email.
 * Validates that both password fields match.
 *
 * @example
 * ```typescript
 * const result = forgotPasswordPassSchema.parse({
 *   password: 'NewSecurePass123!',
 *   confirmPassword: 'NewSecurePass123!'
 * });
 * ```
 */
export const forgotPasswordPassSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Update password form validation schema.
 * Validates password change for authenticated users.
 *
 * @remarks
 * Requires current password for security and validates that
 * new password matches confirmation. Used when user is already logged in.
 *
 * @example
 * ```typescript
 * const result = updatePasswordSchema.parse({
 *   currentPassword: 'OldPass123!',
 *   newPassword: 'NewSecurePass123!',
 *   confirmPassword: 'NewSecurePass123!'
 * });
 * ```
 */
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Add password form validation schema.
 * Validates password for OAuth users adding email/password login.
 *
 * @remarks
 * Same validation as forgot password — new password + confirmation.
 * No current password required since the user has no password yet.
 *
 * @example
 * ```typescript
 * const result = addPasswordSchema.parse({
 *   password: 'NewSecurePass123!',
 *   confirmPassword: 'NewSecurePass123!'
 * });
 * ```
 */
export const addPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

/**
 * Inferred TypeScript type for login form data.
 */
export type LoginFormInput = z.infer<typeof loginSchema>

/**
 * Inferred TypeScript type for sign up form data.
 */
export type SignUpFormInput = z.infer<typeof signUpSchema>

/**
 * Inferred TypeScript type for password reset email form data.
 */
export type ResetPasswordEmailFormInput = z.infer<typeof forgotPasswordEmailSchema>

/**
 * Inferred TypeScript type for password reset password form data.
 */
export type ResetPasswordPassFormInput = z.infer<typeof forgotPasswordPassSchema>

/**
 * Inferred TypeScript type for update password form data.
 */
export type UpdatePasswordFormInput = z.infer<typeof updatePasswordSchema>

/**
 * Inferred TypeScript type for add password form data.
 */
export type AddPasswordFormInput = z.infer<typeof addPasswordSchema>

/**
 * Mapping of authentication operations to their corresponding validation schemas.
 * Provides type-safe access to the correct schema for each auth operation.
 *
 * @example
 * ```typescript
 * const schema = authFormSchemas[AuthOperationsEnum.LOGIN];
 * const result = schema.parse(formData);
 * ```
 */
export const authFormSchemas = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.SIGN_UP]: signUpSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.SET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
  [AuthOperationsEnum.ADD_PASSWORD]: addPasswordSchema,
} as const
