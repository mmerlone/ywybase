/**
 * Admin Users Server Actions
 *
 * Server Actions for user management in the admin dashboard:
 * - Block/delete users (admin only)
 * - Client-triggered read operations for user list/detail queries
 *
 * NOTE: Self-service profile operations are in profile.ts (getOwnProfile)
 *
 * SECURITY: All actions use requireAdminAction() to verify admin/root access
 * before any data operations. This is critical because server actions can
 * be called directly, bypassing page-level middleware.
 */

'use server'

import { ErrorCodes } from '@/lib/error/codes'
import { AuthError } from '@/lib/error/errors'
import { queryAdminProfile, queryAdminUsers } from '@/lib/adminUsers'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  createServerActionSuccess,
  handleServerActionValidation,
  withServerActionErrorHandling,
} from '@/lib/error/server'
import { requireAdminAction } from '@/lib/auth/guards'
import { buildLogger } from '@/lib/logger/server'
import { userIdSchema } from '@/lib/validators/admin'
import type { AuthResponse } from '@/types/error.types'
import { type PaginatedProfilesResult, type ProfilesQueryOptions } from '@/types/admin.types'
import { UserStatusEnum, type Profile } from '@/types/profile.types'
import { convertDbProfile } from '@/lib/utils/profile-utils'
const logger = buildLogger('admin-users-actions')

/**
 * Client-triggered read action for paginated admin users.
 *
 * @param options - Query options for pagination, filtering, and sorting
 * @returns Paginated list of profiles with auth metadata
 */
export const fetchAdminUsersAction = withServerActionErrorHandling(
  async (options: ProfilesQueryOptions = {}): Promise<AuthResponse<PaginatedProfilesResult>> => {
    logger.debug({ options }, 'Starting server action: fetchAdminUsersAction')

    await requireAdminAction()

    const result = await queryAdminUsers(options)

    logger.debug({ count: result.count, page: result.page, pageSize: result.pageSize }, 'Admin users action completed')
    return createServerActionSuccess(result, 'Users retrieved successfully')
  },
  { operation: 'fetchAdminUsersAction', successMessage: 'Users retrieved' }
)

/**
 * Client-triggered read action for a single admin profile.
 *
 * @param userId - The user ID to fetch
 * @returns User profile details with auth metadata
 */
export const fetchAdminProfileAction = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile>> => {
    logger.debug({ userId }, 'Starting server action: fetchAdminProfileAction')

    await requireAdminAction()

    const validated = userIdSchema.safeParse({ userId })
    const validationError = handleServerActionValidation<Profile>(validated, {
      userId,
      operation: 'fetchAdminProfileAction',
    })
    if (validationError) return validationError

    const profile = await queryAdminProfile(userId)

    logger.debug({ userId }, 'User profile retrieved successfully')
    return createServerActionSuccess(profile, 'User profile retrieved')
  },
  { operation: 'fetchAdminProfileAction', successMessage: 'User profile retrieved' }
)

/**
 * Block a user by setting their status to SUSPENDED.
 * Requires admin authorization.
 *
 * @param userId - The ID of the user to block
 * @returns Updated user profile with SUSPENDED status
 */
export const blockUser = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile>> => {
    logger.debug({ userId }, 'Blocking user')

    // Validate userId
    const validated = userIdSchema.safeParse({ userId })
    const validationError = handleServerActionValidation<Profile>(validated, {
      userId,
      operation: 'blockUser',
    })
    if (validationError) return validationError

    const { userId: currentUserId } = await requireAdminAction()

    const supabase = await createClient()

    // Update user status to SUSPENDED
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ status: UserStatusEnum.SUSPENDED })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    logger.info({ userId, blockedBy: currentUserId }, 'User blocked successfully')
    return createServerActionSuccess(convertDbProfile(updatedProfile), 'User blocked successfully')
  },
  {
    operation: 'block-user',
    successMessage: 'User blocked successfully',
  }
)

/**
 * Delete a user permanently.
 * Requires admin authorization and prevents self-deletion.
 *
 * @param userId - The ID of the user to delete
 * @returns Success response
 */
export const deleteUser = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<void>> => {
    logger.debug({ userId }, 'Deleting user')

    // Validate userId
    const validated = userIdSchema.safeParse({ userId })
    const validationError = handleServerActionValidation<void>(validated, {
      userId,
      operation: 'deleteUser',
    })
    if (validationError) return validationError

    const { userId: currentUserId } = await requireAdminAction()

    // EDGE CASE: Prevent deleting self
    if (currentUserId === userId) {
      throw new AuthError({
        code: ErrorCodes.auth.invalidCredentials(),
        message: 'You cannot delete your own account',
        context: { operation: 'deleteUser', userId: currentUserId },
        statusCode: 403,
      })
    }

    // Delete user via admin client (cascades to related data)
    const adminClient = await createAdminClient()
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    logger.info({ userId, deletedBy: currentUserId }, 'User deleted successfully')
    return createServerActionSuccess(undefined, 'User deleted successfully')
  },
  {
    operation: 'delete-user',
    successMessage: 'User deleted successfully',
  }
)
