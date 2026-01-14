/**
 * Authentication Server Actions
 *
 * Server Actions for authentication operations:
 * - Email/password login and registration
 * - Password reset flow (email + set password)
 * - Password update (with current password verification)
 * - Sign out
 * - Email verification
 *
 * @remarks
 * **Security**:
 * - All operations use server-side Supabase client
 * - Password verification via admin client
 * - Zod validation for all inputs
 * - Automatic error handling and logging
 *
 * **Features**:
 * - Path revalidation after state changes
 * - Success/error messages
 * - Operation timing and logging
 *
 * @module actions/auth/server
 */

'use server'

import { ErrorCodes } from '@/lib/error/codes'
import { AuthError } from '@/lib/error/errors'
import {
  createServerActionSuccess,
  handleServerActionValidation,
  withServerActionErrorHandling,
} from '@/lib/error/server'
import type { AuthResponse } from '@/types/error.types'
import { buildLogger } from '@/lib/logger/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  forgotPasswordEmailSchema,
  loginSchema,
  signUpSchema,
  updatePasswordSchema,
  forgotPasswordPassSchema,
} from '@/lib/validators/auth'
import type {
  LoginFormInput,
  SignUpFormInput,
  ResetPasswordEmailFormInput,
  UpdatePasswordFormInput,
  ResetPasswordPassFormInput,
} from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/auth.types'

const logger = buildLogger('auth-server-actions')

/**
 * Verify user's current password without affecting sessions.
 * Uses admin client for secure validation.
 *
 * @param email - User's email address
 * @param password - Password to verify
 * @returns Promise resolving to true if password is valid
 * @internal
 *
 * @remarks
 * **Security**: Uses admin client to avoid session side effects.
 * The verification happens server-side only.
 */
const verifyCurrentPassword = async (email: string, password: string): Promise<boolean> => {
  try {
    const adminClient = await createAdminClient()

    // Use admin client to verify password
    // Note: Admin client operations don't affect the user's actual session
    const {
      data: { user },
      error,
    } = await adminClient.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      logger.warn({ message: error?.message }, 'Password verification failed')
      return false
    }

    if (user) {
      logger.info({ userId: user.id }, 'Password verification successful')
      return true
    }

    return false
  } catch (err) {
    logger.error({ err }, 'Password verification error')
    return false
  }
}

/**
 * Authenticate user with email and password.
 * Creates a new session and sets authentication cookies.
 *
 * @param credentials - Login credentials
 * @param credentials.email - User's email address
 * @param credentials.password - User's password
 * @returns Promise resolving to user ID on success
 * @throws {AuthError} If credentials are invalid or user not found
 *
 * @remarks
 * **Validation**: Uses loginSchema (Zod)
 * **Side Effects**:
 * - Creates new session
 * - Sets authentication cookies
 * - Revalidates root path
 *
 * **Security**: Password sent over HTTPS only.
 *
 * @example
 * ```typescript
 * const result = await loginWithEmail({
 *   email: 'user@example.com',
 *   password: 'securePassword123'
 * })
 * if (result.success) {
 *   console.log('User ID:', result.data.userId)
 *   router.push('/dashboard')
 * } else {
 *   console.error('Login failed:', result.error)
 * }
 * ```
 */
export const loginWithEmail = withServerActionErrorHandling(
  async (credentials: LoginFormInput): Promise<AuthResponse<{ userId: string }>> => {
    // Validate input
    const validated = loginSchema.safeParse(credentials)
    const validationError = handleServerActionValidation<{ userId: string }>(validated, {
      operation: AuthOperationsEnum.LOGIN,
    })
    if (validationError) return validationError

    // Authenticate with Supabase - validated.data is guaranteed to exist after validation
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.data!.email,
      password: validated.data!.password,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    const userId = data.user?.id
    if (!userId) {
      throw new AuthError({
        code: ErrorCodes.auth.userNotFound(),
        message: 'Login completed but user ID could not be retrieved',
        context: { operation: 'login' },
        statusCode: 500,
      })
    }

    logger.info({ userId }, 'User successfully logged in')
    return createServerActionSuccess({ userId }, 'Login successful')
  },
  {
    operation: 'login',
    revalidatePaths: ['/'],
    successMessage: 'Login successful',
  }
)

/**
 * Register a new user with email and password.
 * Sends email verification link.
 *
 * @param credentials - Registration data
 * @param credentials.email - User's email address
 * @param credentials.password - User's password
 * @param credentials.name - User's full name
 * @param credentials.confirmPassword - Password confirmation
 * @param credentials.acceptTerms - Terms acceptance (required)
 * @returns Promise resolving to user ID on success
 * @throws {AuthError} If email already exists or validation fails
 *
 * @remarks
 * **Validation**: Uses signUpSchema (Zod)
 * **Process**:
 * 1. Validate input
 * 2. Create user account
 * 3. Send verification email
 * 4. Return user ID
 *
 * **Email Verification**: User must verify email before login.
 *
 * @example
 * ```typescript
 * const result = await signUpWithEmail({
 *   email: 'new@example.com',
 *   password: 'securePassword123',
 *   name: 'John Doe',
 *   confirmPassword: 'securePassword123',
 *   acceptTerms: true
 * })
 * if (result.success) {
 *   console.log('Account created! Check email for verification.')
 * }
 * ```
 */
export const signUpWithEmail = withServerActionErrorHandling(
  async (credentials: SignUpFormInput): Promise<AuthResponse<{ userId: string }>> => {
    logger.debug({}, 'Initiating user registration')

    // Validate input
    const validated = signUpSchema.safeParse(credentials)
    const validationError = handleServerActionValidation<{ userId: string }>(validated, {
      operation: AuthOperationsEnum.SIGN_UP,
    })
    if (validationError) return validationError

    // Sign up with Supabase - validated.data is guaranteed to exist after validation
    const supabase = await createClient()

    // Determine redirect URL for email verification
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'http://localhost:3000'
    const verificationRoute = `${redirectUrl}/api/auth/confirm`

    const { data, error } = await supabase.auth.signUp({
      email: validated.data!.email,
      password: validated.data!.password,
      options: {
        data: {
          name: validated.data!.name,
        },
        emailRedirectTo: verificationRoute,
      },
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    const userId = data.user?.id
    if (userId === null || userId === undefined) {
      throw new AuthError({
        code: ErrorCodes.auth.userNotFound(),
        message: 'Registration completed but user ID could not be retrieved',
        context: { operation: AuthOperationsEnum.SIGN_UP },
        statusCode: 500,
      })
    }

    logger.info({ userId }, 'User successfully signed up')
    return createServerActionSuccess({ userId }, 'Sign up successful')
  },
  {
    operation: AuthOperationsEnum.SIGN_UP,
    revalidatePaths: ['/'],
    successMessage: 'Sign up successful',
  }
)

/**
 * Sign out the current user.
 * Terminates session and clears authentication cookies.
 *
 * @returns Promise resolving to operation result
 * @throws {Error} If sign out fails
 *
 * @remarks
 * **Side Effects**:
 * - Destroys current session
 * - Clears authentication cookies
 * - Revalidates root path
 *
 * @example
 * ```typescript
 * const result = await signOut()
 * if (result.success) {
 *   router.push('/login')
 * }
 * ```
 */
export const signOut = withServerActionErrorHandling(
  async (): Promise<AuthResponse> => {
    const supabase = await createClient()
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({}, 'User successfully signed out')
    return createServerActionSuccess(undefined, 'Signed out successfully')
  },
  {
    operation: AuthOperationsEnum.SIGN_OUT,
    revalidatePaths: ['/'],
    successMessage: 'Signed out successfully',
  }
)

/**
 * Initiate password reset flow.
 * Sends password reset email with secure link.
 *
 * @param data - Password reset request
 * @param data.email - Email address to send reset link to
 * @returns Promise resolving to operation result
 * @throws {Error} If email send fails
 *
 * @remarks
 * **Flow**:
 * 1. Validate email
 * 2. Generate reset token
 * 3. Send email with reset link
 * 4. Link points to /api/auth/reset-password
 *
 * **Security**: Token expires after 1 hour.
 *
 * **Note**: Returns success even if email doesn't exist (security).
 *
 * @example
 * ```typescript
 * const result = await forgotPassword({
 *   email: 'user@example.com'
 * })
 * if (result.success) {
 *   console.log('Reset email sent! Check your inbox.')
 * }
 * ```
 */
export const forgotPassword = withServerActionErrorHandling(
  async (data: ResetPasswordEmailFormInput): Promise<AuthResponse> => {
    logger.debug({}, 'Processing password reset request')

    // Validate input
    const validated = forgotPasswordEmailSchema.safeParse(data)
    const validationError = handleServerActionValidation<void>(validated, {
      operation: AuthOperationsEnum.FORGOT_PASSWORD,
    })
    if (validationError) return validationError

    // Determine redirect URL - must be the full application URL, not Supabase URL
    // The email link will point to our API route handler which handles the PKCE code exchange
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'http://localhost:3000'
    const apiRoute = `${redirectUrl}/api/auth/reset-password`

    // Send reset email - validated.data is guaranteed to exist after validation
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(validated.data!.email, {
      redirectTo: apiRoute,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({}, 'Password reset email sent')
    return createServerActionSuccess(undefined, 'Password reset link sent. Please check your email.')
  },
  {
    operation: AuthOperationsEnum.FORGOT_PASSWORD,
    successMessage: 'Password reset link sent. Please check your email.',
  }
)

/**
 * Complete password reset by setting new password.
 * Used after clicking reset link from email.
 *
 * @param data - New password data
 * @param data.password - The new password
 * @param data.confirmPassword - Password confirmation
 * @returns Promise resolving to operation result
 * @throws {Error} If password update fails
 *
 * @remarks
 * **Context**: Called from password reset page after email link clicked.
 *
 * **Validation**: Uses forgotPasswordPassSchema (Zod)
 *
 * **No Current Password Required**: Reset token validates user.
 *
 * **Security**: Token must be valid and not expired.
 *
 * @example
 * ```typescript
 * // On password reset page
 * const result = await setPassword({
 *   password: 'newSecurePassword123!',
 *   confirmPassword: 'newSecurePassword123!'
 * })
 * if (result.success) {
 *   console.log('Password reset successful!')
 *   router.push('/login')
 * }
 * ```
 */
export const setPassword = withServerActionErrorHandling(
  async (data: ResetPasswordPassFormInput): Promise<AuthResponse> => {
    logger.debug({}, 'Completing password reset')

    // Validate input
    const validated = forgotPasswordPassSchema.safeParse(data)
    const validationError = handleServerActionValidation<void>(validated, {
      operation: AuthOperationsEnum.SET_PASSWORD,
    })
    if (validationError) return validationError

    // Update password - validated.data is guaranteed to exist after validation
    const supabase = await createClient()
    const { error } = await supabase.auth.updateUser({
      password: validated.data!.password,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({}, 'Password reset completed successfully')
    return createServerActionSuccess(undefined, 'Password reset completed successfully')
  },
  {
    operation: AuthOperationsEnum.SET_PASSWORD,
    revalidatePaths: ['/'],
    successMessage: 'Password reset completed successfully',
  }
)

/**
 * Update password for logged-in users.
 * Requires current password verification.
 *
 * @param data - Password update data
 * @param data.currentPassword - Current password for verification
 * @param data.newPassword - The new password
 * @param data.confirmPassword - Password confirmation
 * @returns Promise resolving to operation result
 * @throws {AuthError} If current password is incorrect or validation fails
 *
 * @remarks
 * **Security**:
 * - Requires valid session
 * - Current password verified via admin client
 * - No session side effects during verification
 *
 * **Validation**: Uses updatePasswordSchema (Zod)
 *
 * **Difference from setPassword**:
 * - updatePassword: For logged-in users (requires current password)
 * - setPassword: For password reset (requires reset token)
 *
 * @example
 * ```typescript
 * // In profile settings
 * const result = await updatePassword({
 *   currentPassword: 'oldPassword123',
 *   newPassword: 'newSecurePassword123!',
 *   confirmPassword: 'newSecurePassword123!'
 * })
 * if (result.success) {
 *   console.log('Password updated successfully!')
 * } else {
 *   console.error('Update failed:', result.error)
 * }
 * ```
 */
export const updatePassword = withServerActionErrorHandling(
  async (data: UpdatePasswordFormInput): Promise<AuthResponse> => {
    // Validate input
    const validated = updatePasswordSchema.safeParse(data)
    const validationError = handleServerActionValidation<void>(validated, {
      operation: AuthOperationsEnum.UPDATE_PASSWORD,
    })
    if (validationError) return validationError

    const supabase = await createClient()

    // Verify current password first (password change flow)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email === null || user?.email === undefined) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidToken(),
        message: 'User authentication required',
        context: { operation: AuthOperationsEnum.UPDATE_PASSWORD },
        statusCode: 401,
      })
    }

    // Verify current password securely without session side effects
    const isPasswordValid = await verifyCurrentPassword(user.email, validated.data!.currentPassword)

    if (!isPasswordValid) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidCredentials(),
        message: 'Current password is incorrect',
        context: { operation: AuthOperationsEnum.UPDATE_PASSWORD },
        statusCode: 401,
      })
    }

    // Update to new password - validated.data is guaranteed to exist after validation
    const { error } = await supabase.auth.updateUser({
      password: validated.data!.newPassword,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({}, 'Password updated successfully')
    return createServerActionSuccess(undefined, 'Password updated successfully')
  },
  {
    operation: AuthOperationsEnum.UPDATE_PASSWORD,
    successMessage: 'Password updated successfully',
  }
)

/**
 * Check if user's email has been verified.
 * Returns verification status.
 *
 * @param formData - Form data containing userId
 * @returns Promise resolving to verification status
 * @throws {AuthError} If user not found or userId missing
 *
 * @remarks
 * **Response**: `{ verified: boolean }`
 *
 * **Use Case**: Check if user needs to verify email before accessing features.
 *
 * @example
 * ```typescript
 * const formData = new FormData()
 * formData.append('userId', userId)
 *
 * const result = await checkVerificationStatus(formData)
 * if (result.success && result.data.verified) {
 *   console.log('Email verified!')
 * } else {
 *   console.log('Please verify your email')
 * }
 * ```
 */
export const checkVerificationStatus = withServerActionErrorHandling(
  async (formData: FormData): Promise<AuthResponse> => {
    logger.debug({}, 'Checking verification status')

    const userId = formData.get('userId') as string

    if (!userId) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidCredentials(),
        message: 'User ID is required',
        statusCode: 400,
      })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      throw error // Let the middleware handle this
    }

    if (!user) {
      throw new AuthError({
        code: ErrorCodes.auth.userNotFound(),
        message: 'User not found',
        statusCode: 404,
      })
    }

    const isVerified = !!user.email_confirmed_at

    logger.info({ userId, isVerified }, 'Verification status checked')

    return createServerActionSuccess(
      { verified: isVerified },
      isVerified ? 'Email is verified' : 'Email verification required'
    )
  },
  {
    operation: AuthOperationsEnum.SET_PASSWORD,
    successMessage: 'Verification status checked',
  }
)

/**
 * Resend email verification link.
 * Sends a new verification email to the user.
 *
 * @returns Promise resolving to operation result
 * @throws {AuthError} If user not found or email not available
 *
 * @remarks
 * **Rate Limiting**: Consider implementing rate limits to prevent abuse.
 *
 * **Flow**:
 * 1. Get current user from session
 * 2. Generate new verification token
 * 3. Send email with verification link
 *
 * **Use Case**: User didn't receive initial verification email.
 *
 * @example
 * ```typescript
 * const result = await resendVerification()
 * if (result.success) {
 *   console.log('Verification email sent! Check your inbox.')
 * } else {
 *   console.error('Failed to send email:', result.error)
 * }
 * ```
 */
export const resendVerification = withServerActionErrorHandling(
  async (): Promise<AuthResponse> => {
    logger.debug({}, 'Resending verification email')

    // Get user securely from auth server (not from cookies)
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw userError // Let the middleware handle this
    }

    if (!user?.email) {
      throw new AuthError({
        code: ErrorCodes.auth.userNotFound(),
        message: 'User not found or email not available',
        statusCode: 404,
      })
    }

    // Determine redirect URL for email verification
    const redirectUrl = process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || 'http://localhost:3000'
    const verificationRoute = `${redirectUrl}/api/auth/confirm`

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
      options: {
        emailRedirectTo: verificationRoute,
      },
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({ email: user.email }, 'Verification email resent successfully')
    return createServerActionSuccess(undefined, 'Verification email sent successfully')
  },
  {
    operation: AuthOperationsEnum.RESEND_VERIFICATION,
    successMessage: 'Verification email sent successfully',
  }
)
