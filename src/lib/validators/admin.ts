/**
 * Admin Validators
 *
 * Zod schemas for validating admin dashboard inputs.
 */

import { z } from 'zod'

import { UserStatusFilterEnum } from '@/types/profile.types'
import { ProfileSortByEnum, UserRoleFilterEnum } from '@/types/admin.types'
import { PAGINATION_CONFIG } from '@/config/query'
import { SortOrderEnum } from '../../types/database'

/**
 * Schema for validating user query options
 */
export const usersQuerySchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z
    .number()
    .int()
    .refine((val) => PAGINATION_CONFIG.adminProfiles.allowedPageSizes.includes(val as 10 | 25 | 50 | 100), {
      message: `Page size must be one of: ${PAGINATION_CONFIG.adminProfiles.allowedPageSizes.join(', ')}`,
    })
    .default(PAGINATION_CONFIG.adminProfiles.defaultPageSize),
  status: z.enum(UserStatusFilterEnum).optional(),
  role: z.enum(UserRoleFilterEnum).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(ProfileSortByEnum).optional().default(ProfileSortByEnum.DISPLAY_NAME),
  sortOrder: z.enum(SortOrderEnum).optional().default(SortOrderEnum.ASC),
})

/**
 * Inferred type for users query options
 */
export type UsersQueryInput = z.infer<typeof usersQuerySchema>

/**
 * Schema for validating user ID parameter
 */
export const userIdSchema = z.object({
  userId: z.uuid({ error: 'Invalid user ID format' }),
})

/**
 * Inferred type for user ID input
 */
export type UserIdInput = z.infer<typeof userIdSchema>
