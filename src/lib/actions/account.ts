/**
 * Account Management Server Actions
 *
 * Server Actions for account-related operations:
 * - Personal data export (GDPR compliance)
 * - Account deletion with password verification
 *
 * @remarks
 * All actions require authentication and use server-side Supabase client.
 * Operations are wrapped with error handling and logging.
 *
 * @module actions/account
 */

'use server'

import { ErrorCodes } from '@/lib/error/codes'
import { AuthError } from '@/lib/error/errors'
import { createServerActionSuccess, withServerActionErrorHandling } from '@/lib/error/server'
import type { AuthResponse } from '@/types/error.types'
import { buildLogger } from '@/lib/logger/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'

const logger = buildLogger('account-server-actions')

/**
 * Generate a downloadable personal data export for GDPR compliance.
 * Includes profile data, authentication info, and metadata in JSON format.
 *
 * @returns Promise resolving to JSON string with user's personal data
 * @throws {AuthError} If user is not authenticated
 *
 * @remarks
 * **GDPR Compliance**: Provides users with their complete data export.
 *
 * **Export Contents**:
 * - User authentication data (ID, email, timestamps)
 * - Profile information (if exists)
 * - Export timestamp
 *
 * **Security**: Requires valid user session.
 *
 * @example
 * ```typescript
 * const result = await downloadPersonalData()
 * if (result.success && result.data) {
 *   // Create and trigger download
 *   const blob = new Blob([result.data], { type: 'application/json' })
 *   const url = URL.createObjectURL(blob)
 *   const a = document.createElement('a')
 *   a.href = url
 *   a.download = 'my-data.json'
 *   a.click()
 * }
 * ```
 */
export const downloadPersonalData = withServerActionErrorHandling(
  async (): Promise<AuthResponse<string>> => {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidToken(),
        message: 'User authentication required',
        context: { operation: 'download-personal-data' },
        statusCode: 401,
      })
    }

    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      // Compile personal data
      const personalData = {
        exportDate: new Date().toISOString(),
        user: {
          id: user.id,
          email: user.email,
          emailConfirmed: user.email_confirmed_at ? true : false,
          createdAt: user.created_at,
          lastSignIn: user.last_sign_in_at,
        },
        profile: profile || null,
      }

      // Convert to JSON string
      const jsonData = JSON.stringify(personalData, null, 2)

      logger.info({ userId: user.id }, 'Personal data exported successfully')
      return createServerActionSuccess(jsonData, 'Personal data exported successfully')
    } catch (error) {
      logger.error({ userId: user.id, error }, 'Failed to export personal data')
      throw error
    }
  },
  {
    operation: 'download-personal-data',
    successMessage: 'Personal data exported successfully',
  }
)

/**
 * Delete a user's account permanently.
 * Requires password verification for security.
 *
 * @param password - Current password for verification
 * @returns Promise resolving to success or error
 * @throws {AuthError} If password is invalid or user is not authenticated
 *
 * @remarks
 * **Destructive Operation**: Permanently deletes:
 * - User authentication record
 * - User profile data
 * - All sessions (automatic cascade)
 *
 * **Security Measures**:
 * - Password re-verification required
 * - Uses admin client for secure password check
 * - Session cleared after deletion
 *
 * **Warning**: This action cannot be undone.
 *
 * @example
 * ```typescript
 * const result = await deleteAccount('currentPassword')
 * if (result.success) {
 *   // Account deleted successfully
 *   router.push('/')
 * } else {
 *   // Show error: result.error.message
 * }
 * ```
 */
export const deleteAccount = withServerActionErrorHandling(
  async (password: string): Promise<AuthResponse> => {
    if (!password || typeof password !== 'string' || password.length === 0) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidCredentials(),
        message: 'Password is required to delete account',
        context: { operation: 'delete-account' },
        statusCode: 400,
      })
    }

    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.email) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidToken(),
        message: 'User authentication required',
        context: { operation: 'delete-account' },
        statusCode: 401,
      })
    }

    try {
      // Verify password using admin client
      const adminClient = await createAdminClient()
      const { data, error } = await adminClient.auth.signInWithPassword({
        email: user.email,
        password,
      })

      if (error || !data.user) {
        logger.warn({ userId: user.id }, 'Account deletion failed: Invalid password')
        throw new AuthError({
          code: ErrorCodes.auth.invalidCredentials(),
          message: 'Invalid password',
          context: { operation: 'delete-account' },
          statusCode: 401,
        })
      }

      // Delete user via admin API (cascades to related data)
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

      if (deleteError) {
        throw deleteError
      }

      // Sign out the user's session to clear client-side cookies/tokens
      await supabase.auth.signOut()

      logger.info({ userId: user.id }, 'Account deleted successfully')
      return createServerActionSuccess(undefined, 'Account deleted successfully')
    } catch (error) {
      if (error instanceof AuthError) {
        throw error
      }
      logger.error({ userId: user.id, error }, 'Failed to delete account')
      throw error
    }
  },
  {
    operation: 'delete-account',
    successMessage: 'Account deleted successfully',
  }
)
