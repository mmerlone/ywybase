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
  addPasswordSchema,
  forgotPasswordEmailSchema,
  loginSchema,
  signUpSchema,
  updatePasswordSchema,
  forgotPasswordPassSchema,
} from '@/lib/validators/auth'
import {
  AuthOperationsEnum,
  type AddPasswordFormInput,
  type LoginFormInput,
  type SignUpFormInput,
  type ResetPasswordEmailFormInput,
  type UpdatePasswordFormInput,
  type ResetPasswordPassFormInput,
} from '@/types/auth.types'
import { headers } from 'next/headers'
import { findUserByEmail } from '@/lib/auth/admin'

const logger = buildLogger('auth-server-actions')

/**
 * Gets the current site URL for redirect construction.
 * Prioritizes request header 'origin', falls back to env var, then localhost.
 */
async function getSiteUrl(): Promise<string> {
  const headersList = await headers()

  // Use standard headers provided by Vercel/Next.js for the absolute URL
  const host = headersList.get('x-forwarded-host') ?? headersList.get('host')
  const proto = headersList.get('x-forwarded-proto') ?? 'https'

  if (host) {
    return `${proto}://${host}`
  }

  // Fallback for extreme cases
  return process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 'http://localhost:3000'
}

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
      logger.warn({ email, message: error?.message }, 'Password verification failed')
      return false
    }

    if (user) {
      logger.info({ userId: user.id, email }, 'Password verification successful')
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

    logger.info({ userId, email: validated.data!.email }, 'User successfully logged in')
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
    logger.debug({ operation: 'signUp', email: credentials.email }, 'Initiating user registration')

    // Validate input
    const validated = signUpSchema.safeParse(credentials)
    const validationError = handleServerActionValidation<{ userId: string }>(validated, {
      operation: AuthOperationsEnum.SIGN_UP,
    })
    if (validationError) return validationError

    logger.info({ email: validated.data!.email }, 'Processing user registration request')

    // Internal audit check for user existence
    const { found, id: existingUserId } = await findUserByEmail(validated.data!.email)

    if (found) {
      logger.info(
        { email: validated.data!.email, userId: existingUserId },
        'User already exists during registration attempt'
      )
    } else {
      logger.info({ email: validated.data!.email }, 'New user registration attempt')
    }

    // Sign up with Supabase - validated.data is guaranteed to exist after validation
    const supabase = await createClient()

    logger.debug(
      {
        email: validated.data!.email,
        clientType: 'server-action',
        cookieStoreAvailable: true,
      },
      'Creating Supabase client for signup - PKCE verifier storage enabled'
    )

    // Determine redirect URL for email verification using robust origin detection
    const siteUrl = await getSiteUrl()
    const verificationRoute = new URL('/api/auth/confirm', siteUrl).toString()

    logger.debug(
      {
        email: validated.data!.email,
        verificationRoute,
        siteUrl,
      },
      'Making Supabase signup request'
    )

    const { data, error } = await supabase.auth.signUp({
      email: validated.data!.email,
      password: validated.data!.password,
      options: {
        data: {
          name: validated.data!.name,
          signup_method: 'email',
        },
        emailRedirectTo: verificationRoute,
      },
    })

    logger.debug(
      {
        email: validated.data!.email,
        responseData: data,
        error: error
          ? {
              message: error.message,
              status: error.status,
              code: error.code ?? 'NO_CODE',
            }
          : null,
        success: !error,
      },
      'Supabase signup response received'
    )

    if (error) {
      logger.error(
        {
          email: validated.data!.email,
          error: error.message,
          status: error.status,
          code: error.code,
        },
        'Supabase signup request failed'
      )
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

    logger.info({ userId, email: validated.data!.email }, 'User successfully signed up')
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

    logger.info({ operation: 'signOut' }, 'User successfully signed out')
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
    logger.debug({ operation: 'forgotPassword', email: data.email }, 'Processing password reset request')

    // Validate input
    const validated = forgotPasswordEmailSchema.safeParse(data)
    const validationError = handleServerActionValidation<void>(validated, {
      operation: AuthOperationsEnum.FORGOT_PASSWORD,
    })
    if (validationError) return validationError

    // Determine redirect URL for password reset using robust origin detection
    const siteUrl = await getSiteUrl()
    const apiRoute = new URL('/api/auth/reset-password', siteUrl).toString()

    logger.info({ email: validated.data!.email }, 'Processing password reset request')

    // Internal audit check for user existence
    const { found, id: userId } = await findUserByEmail(validated.data!.email)

    if (found) {
      logger.info({ email: validated.data!.email, userId }, 'User found for password reset')
    } else {
      logger.info({ email: validated.data!.email }, 'User not found for password reset')
    }

    // Send reset email
    const supabase = await createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(validated.data!.email, {
      redirectTo: apiRoute,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({ email: validated.data!.email }, 'Password reset email request processed')
    return createServerActionSuccess(
      undefined,
      "If an account exists with this email, we've sent instructions. Please check your inbox."
    )
  },
  {
    operation: AuthOperationsEnum.FORGOT_PASSWORD,
    successMessage: "If an account exists with this email, we've sent instructions. Please check your inbox.",
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
    logger.debug({ operation: 'setPassword' }, 'Completing password reset')

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

    logger.info({ operation: 'setPassword' }, 'Password reset completed successfully')
    return createServerActionSuccess(undefined, 'Password reset completed successfully')
  },
  {
    operation: AuthOperationsEnum.SET_PASSWORD,
    revalidatePaths: ['/'],
    successMessage: 'Password reset completed successfully',
  }
)

/**
 * Add password to an OAuth-only account.
 * Allows social login users to also sign in with email/password.
 *
 * @param data - New password data
 * @param data.password - The new password
 * @param data.confirmPassword - Password confirmation
 * @returns Promise resolving to operation result
 * @throws {AuthError} If user already has a password or validation fails
 *
 * @remarks
 * **Context**: Called from the Account tab for users who signed up via OAuth.
 *
 * **Validation**: Uses addPasswordSchema (Zod)
 *
 * **No Current Password Required**: User has no existing password.
 *
 * **Security**: Verifies the user doesn't already have an email identity
 * before adding one. Uses `supabase.auth.updateUser({ password })` which
 * is the Supabase-recommended way to add email/password login to OAuth accounts.
 *
 * @example
 * ```typescript
 * const result = await addPassword({
 *   password: 'newSecurePassword123!',
 *   confirmPassword: 'newSecurePassword123!'
 * })
 * if (result.success) {
 *   console.log('Password added! You can now sign in with email/password.')
 * }
 * ```
 */
export const addPassword = withServerActionErrorHandling(
  async (data: AddPasswordFormInput): Promise<AuthResponse> => {
    logger.debug({ operation: 'addPassword' }, 'Adding password to OAuth account')

    // Validate input
    const validated = addPasswordSchema.safeParse(data)
    const validationError = handleServerActionValidation<void>(validated, {
      operation: AuthOperationsEnum.ADD_PASSWORD,
    })
    if (validationError) return validationError

    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user?.email === null || user?.email === undefined) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidToken(),
        message: 'User authentication required',
        context: { operation: AuthOperationsEnum.ADD_PASSWORD },
        statusCode: 401,
      })
    }

    // Guard: verify the user doesn't already have an email identity
    const { data: profile } = await supabase.from('profiles').select('providers').eq('id', user.id).single()

    const hasEmailIdentity = profile?.providers?.includes('email') ?? false
    if (hasEmailIdentity) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidCredentials(),
        message: 'This account already has a password. Use "Change Password" instead.',
        context: { operation: AuthOperationsEnum.ADD_PASSWORD },
        statusCode: 400,
      })
    }

    // Add password to the account - this creates the email identity
    const { error } = await supabase.auth.updateUser({
      password: validated.data!.password,
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({ userId: user.id, operation: 'addPassword' }, 'Password added to OAuth account successfully')
    return createServerActionSuccess(
      undefined,
      'Password added successfully! You can now sign in with email and password.'
    )
  },
  {
    operation: AuthOperationsEnum.ADD_PASSWORD,
    revalidatePaths: ['/'],
    successMessage: 'Password added successfully',
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

    logger.info({ operation: 'updatePassword' }, 'Password updated successfully')
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
    logger.debug({ operation: 'checkVerificationStatus' }, 'Checking verification status')

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

    const isVerified = Boolean(user.email_confirmed_at)

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
 * Sends a new verification email to the specified or current user.
 *
 * @param email - Optional email address. If provided, sends to this email (unauthenticated flow).
 *                If not provided, uses the current authenticated user's email (authenticated flow).
 * @returns Promise resolving to operation result
 * @throws {AuthError} If no email provided and user not found/authenticated
 *
 * @remarks
 * **Dual Flow Support**:
 * - **Unauthenticated**: Pass an email address for users who haven't logged in yet
 *   (e.g., from the public resend verification form)
 * - **Authenticated**: Omit email to resend to the current logged-in user
 *   (e.g., from the VerificationStatus component)
 *
 * **Rate Limiting**: Consider implementing rate limits to prevent abuse.
 *
 * @example
 * ```typescript
 * // Unauthenticated flow (public form)
 * const result = await resendVerification('user@example.com')
 *
 * // Authenticated flow (logged-in user)
 * const result = await resendVerification()
 *
 * if (result.success) {
 *   console.log('Verification email sent! Check your inbox.')
 * } else {
 *   console.error('Failed to send email:', result.error)
 * }
 * ```
 */
export const resendVerification = withServerActionErrorHandling(
  async (email?: string): Promise<AuthResponse> => {
    logger.debug(
      { operation: 'resendVerification', email: email ? 'provided' : 'authenticated' },
      'Resending verification email'
    )

    let targetEmail: string
    const supabase = await createClient()

    if (email) {
      // Unauthenticated flow: Use provided email directly
      targetEmail = email
      logger.debug({ email: targetEmail }, 'Processing verification resend for provided email')

      // Internal audit check for user existence
      const { found, id: userId } = await findUserByEmail(targetEmail)

      if (found) {
        logger.info({ email: targetEmail, userId }, 'User found for verification resend')
      } else {
        logger.info({ email: targetEmail }, 'User not found for verification resend')
      }
    } else {
      // Authenticated flow: Get user from session
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        logger.error({ error: userError }, 'Failed to get user from session for verification resend')
        throw userError
      }

      if (!user?.email) {
        logger.error({ userId: user?.id }, 'User email missing in session for verification resend')
        throw new AuthError({
          code: ErrorCodes.auth.userNotFound(),
          message: 'User email not found in session',
          statusCode: 404,
        })
      }
      targetEmail = user.email
      logger.info({ email: targetEmail, userId: user.id }, 'User found in session for verification resend')
    }

    // Determine redirect URL for email verification using robust origin detection
    const siteUrl = await getSiteUrl()
    const verificationRoute = new URL('/api/auth/confirm', siteUrl).toString()

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: targetEmail,
      options: {
        emailRedirectTo: verificationRoute,
      },
    })

    if (error) {
      throw error // Let the middleware handle this
    }

    logger.info({ email: targetEmail }, 'Verification email resend request processed')
    return createServerActionSuccess(
      undefined,
      "If an account exists with this email, we've sent instructions. Please check your inbox."
    )
  },
  {
    operation: AuthOperationsEnum.RESEND_VERIFICATION,
    successMessage: "If an account exists with this email, we've sent instructions. Please check your inbox.",
  }
)
