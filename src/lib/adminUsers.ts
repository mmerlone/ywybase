import 'server-only'

import { PAGINATION_CONFIG } from '@/config/query'
import { ErrorCodes } from '@/lib/error/codes'
import { AuthError, BusinessError } from '@/lib/error/errors'
import { buildLogger } from '@/lib/logger/server'
import { createClient } from '@/lib/supabase/server'
import { convertDbProfile } from '@/lib/utils/profile-utils'
import { escapePostgrestIlike } from '@/lib/utils/postgrest'
import { userIdSchema, usersQuerySchema } from '@/lib/validators/admin'
import {
  DbUserRoleEnum,
  ProfileSortByEnum,
  type DashboardStats,
  type PaginatedProfilesResult,
  type ProfilesQueryOptions,
  UserRoleFilterEnum,
} from '@/types/admin.types'
import { SortOrderEnum } from '@/types/database'
import { UserStatusEnum, UserStatusFilterEnum, type Profile } from '@/types/profile.types'

const logger = buildLogger('admin-users-queries')

/**
 * Create a consistent dashboard stats query error.
 *
 * @param error - Original query error
 * @param context - Query context label
 * @returns Auth error with structured context
 */
function createDashboardStatsError(error: unknown, context: string): AuthError {
  logger.error({ error, operation: 'queryAdminDashboardStats', context }, 'Admin dashboard stats query failed')

  return new AuthError({
    code: ErrorCodes.database.unknownPostgrestError(),
    message: `Dashboard stats query failed: ${context}`,
    context: { operation: 'queryAdminDashboardStats' },
    cause: error instanceof Error ? error : undefined,
    statusCode: 500,
  })
}

/**
 * Query paginated admin user data in an already-authorized server context.
 *
 * @param options - Query options for pagination, filtering, and sorting
 * @returns Paginated profiles result
 */
export async function queryAdminUsers(options: ProfilesQueryOptions = {}): Promise<PaginatedProfilesResult> {
  const validated = usersQuerySchema.safeParse(options)
  if (!validated.success) {
    throw new BusinessError({
      code: ErrorCodes.validation.invalidInput(),
      message: 'Invalid admin users query options',
      context: { operation: 'queryAdminUsers' },
      statusCode: 400,
      cause: validated.error,
    })
  }

  const {
    page,
    pageSize = PAGINATION_CONFIG.adminProfiles.defaultPageSize,
    status,
    role,
    search,
    sortBy,
    sortOrder,
  } = validated.data

  const supabase = await createClient()
  let query = supabase.from('profiles').select('*', { count: 'exact' })

  if (status !== undefined && status !== UserStatusFilterEnum.ALL) {
    query = query.eq('status', status)
  }

  if (role !== undefined && role !== UserRoleFilterEnum.ALL && role !== UserRoleFilterEnum.GUEST) {
    const validDbRoles = Object.values(DbUserRoleEnum) as string[]
    if (validDbRoles.includes(role)) {
      query = query.eq('role', role)
    }
  }

  if (search !== undefined && search !== '') {
    const escapedSearch = escapePostgrestIlike(search)
    query = query.or(`email.ilike.%${escapedSearch}%,display_name.ilike.%${escapedSearch}%`)
  }

  query = query.order(sortBy ?? ProfileSortByEnum.DISPLAY_NAME, {
    ascending: sortOrder === SortOrderEnum.ASC,
  })

  const offset = (page - 1) * pageSize
  query = query.range(offset, offset + pageSize - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  const totalValue = count ?? 0

  logger.debug({ page, pageSize, totalUsers: totalValue }, 'Admin users retrieved successfully')

  return {
    data: (data ?? []).map(convertDbProfile),
    count: totalValue,
    page,
    pageSize,
    pageCount: Math.ceil(totalValue / pageSize),
  }
}

/**
 * Query a single admin-visible profile in an already-authorized server context.
 *
 * @param userId - Profile ID to fetch
 * @returns Profile details
 */
export async function queryAdminProfile(userId: string): Promise<Profile> {
  const validated = userIdSchema.safeParse({ userId })
  if (!validated.success) {
    throw new BusinessError({
      code: ErrorCodes.validation.invalidInput(),
      message: 'Invalid user ID format',
      context: { operation: 'queryAdminProfile' },
      statusCode: 400,
      cause: validated.error,
    })
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) {
    if (error.code === 'PGRST116') {
      throw new BusinessError({
        code: ErrorCodes.database.notFound(),
        message: 'Profile not found',
        context: { operation: 'queryAdminProfile', userId },
        statusCode: 404,
      })
    }

    throw error
  }

  logger.debug({ userId }, 'Admin profile retrieved successfully')

  return convertDbProfile(data)
}

/**
 * Query dashboard overview statistics in an already-authorized server context.
 *
 * @returns Dashboard summary metrics
 */
export async function queryAdminDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [totalResult, activeResult, signupsResult, pendingResult] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_sign_in_at', thirtyDaysAgo.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).gte('created_at', sevenDaysAgo.toISOString()),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('status', UserStatusEnum.PENDING),
  ])

  if (totalResult.error) {
    throw createDashboardStatsError(totalResult.error, 'totalUsers')
  }

  if (activeResult.error) {
    throw createDashboardStatsError(activeResult.error, 'activeUsers')
  }

  if (signupsResult.error) {
    throw createDashboardStatsError(signupsResult.error, 'recentSignups')
  }

  if (pendingResult.error) {
    throw createDashboardStatsError(pendingResult.error, 'pendingUsers')
  }

  const stats: DashboardStats = {
    totalUsers: totalResult.count ?? 0,
    activeUsers: activeResult.count ?? 0,
    recentSignups: signupsResult.count ?? 0,
    pendingUsers: pendingResult.count ?? 0,
  }

  logger.debug({ stats }, 'Admin dashboard stats retrieved successfully')

  return stats
}
