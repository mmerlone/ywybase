/**
 * Server-Side Authentication Guards
 *
 * Provides reusable utilities for protecting server components and pages.
 * These guards complement middleware by providing explicit, type-safe auth checks
 * at the page/component level for defense-in-depth.
 *
 * @module lib/auth/guards
 *
 * @example
 * ```typescript
 * // In a server component
 * import { requireAuth, requireAdmin } from '@/lib/auth/guards'
 *
 * export default async function ProtectedPage() {
 *   const { user, role } = await requireAuth()
 *   // User is guaranteed to be authenticated
 * }
 *
 * export default async function AdminPage() {
 *   const { user, role } = await requireAdmin()
 *   // User is guaranteed to be admin or root
 * }
 * ```
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { buildLogger } from '@/lib/logger/server'
import type { User } from '@supabase/supabase-js'
import { UserRoleEnum, type UserRole } from '@/types/admin.types'
import { ROUTES } from '@/config/routes'
import { normalizeUserRole } from '@/lib/utils/role-utils'

const logger = buildLogger('auth-guards')

/**
 * Result of a successful auth guard check.
 */
export interface AuthGuardResult {
  /** Authenticated Supabase user */
  user: User
  /** User's role from auth metadata (normalized) */
  role: UserRole
}

/**
 * Options for the requireAuth guard.
 */
export interface RequireAuthOptions {
  /**
   * Roles that are allowed access. If empty or undefined, any authenticated user is allowed.
   * Roles are checked against the user's profile role field.
   */
  requiredRoles?: UserRole[]
  /**
   * Path to redirect to if user is not authenticated.
   * @default '/auth'
   */
  authRedirect?: string
  /**
   * Path to redirect to if user lacks required role.
   * @default '/unauthorized' (or '/' if unauthorized page doesn't exist)
   */
  unauthorizedRedirect?: string
}

/**
 * Require authentication for a server component or page.
 *
 * Redirects to auth page if user is not authenticated.
 * Optionally checks for specific role requirements.
 *
 * @param options - Guard configuration options
 * @returns Authenticated user and their role
 * @throws Never - redirects instead of throwing
 *
 * @example
 * ```typescript
 * // Basic auth requirement
 * const { user, role } = await requireAuth()
 *
 * // With role requirement (use UserRoleEnum values)
 * const { user, role } = await requireAuth({
 *   requiredRoles: [UserRoleEnum.ADMIN, UserRoleEnum.ROOT]
 * })
 * ```
 */
export async function requireAuth(options: RequireAuthOptions = {}): Promise<AuthGuardResult> {
  const { requiredRoles = [], authRedirect = ROUTES.AUTH.path, unauthorizedRedirect = '/' } = options

  const supabase = await createClient()

  // Use getUser() for secure server-side authentication (validates with auth server)
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    logger.warn({ error }, 'Auth guard: Failed to get user')
    redirect(authRedirect)
  }

  if (!user) {
    logger.debug({ redirect: authRedirect }, 'Auth guard: No user, redirecting to auth')
    redirect(authRedirect)
  }

  const role = normalizeUserRole(user.app_metadata?.role)

  // Check role requirements if specified
  if (requiredRoles.length > 0) {
    if (!requiredRoles.includes(role)) {
      logger.warn({ userId: user.id, userRole: role, requiredRoles }, 'Auth guard: User lacks required role')
      redirect(unauthorizedRedirect)
    }
  }

  logger.debug({ userId: user.id, role }, 'Auth guard: Access granted')

  return { user, role }
}

/**
 * Require admin access (admin or root role).
 *
 * Convenience wrapper for common admin guard pattern.
 * Redirects to unauthorized page if user lacks admin privileges.
 *
 * @param options - Optional configuration overrides
 * @returns Authenticated admin user and their role
 *
 * @example
 * ```typescript
 * export default async function AdminDashboard() {
 *   const { user, role } = await requireAdmin()
 *   // User is guaranteed to be admin or root
 * }
 * ```
 */
export async function requireAdmin(options: Omit<RequireAuthOptions, 'requiredRoles'> = {}): Promise<AuthGuardResult> {
  return requireAuth({
    ...options,
    requiredRoles: [UserRoleEnum.ADMIN, UserRoleEnum.ROOT],
  })
}

/**
 * Require moderator or higher access.
 *
 * @param options - Optional configuration overrides
 * @returns Authenticated moderator+ user and their role
 */
export async function requireModerator(
  options: Omit<RequireAuthOptions, 'requiredRoles'> = {}
): Promise<AuthGuardResult> {
  return requireAuth({
    ...options,
    requiredRoles: [UserRoleEnum.MODERATOR, UserRoleEnum.ADMIN, UserRoleEnum.ROOT],
  })
}

/**
 * Check if user is authenticated without redirecting.
 *
 * Useful for conditional rendering in server components.
 *
 * @returns User and role if authenticated, null otherwise
 *
 * @example
 * ```typescript
 * const auth = await getAuthStatus()
 * if (auth) {
 *   // User is authenticated
 *   console.log(auth.user.email)
 * }
 * ```
 */
export async function getAuthStatus(): Promise<AuthGuardResult | null> {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const role = normalizeUserRole(user.app_metadata?.role)

  return { user, role }
}

/**
 * Require admin role for server actions.
 *
 * Unlike `requireAdmin()` which redirects, this throws an AuthError
 * for use in server actions where we need structured error responses.
 *
 * @returns Authenticated admin user ID and role
 * @throws AuthError if user is not authenticated or lacks admin role
 *
 * @example
 * ```typescript
 * export const adminAction = withServerActionErrorHandling(
 *   async () => {
 *     const { userId, role } = await requireAdminAction()
 *     // User is guaranteed to be admin or root
 *   },
 *   { operation: 'adminAction' }
 * )
 * ```
 */
export async function requireAdminAction(): Promise<{ userId: string; role: UserRole }> {
  const { AuthError } = await import('@/lib/error/errors')
  const { ErrorCodes } = await import('@/lib/error/codes')

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user?.id) {
    throw new AuthError({
      code: ErrorCodes.auth.invalidToken(),
      message: 'Authentication required',
      context: { operation: 'requireAdminAction' },
      statusCode: 401,
    })
  }

  const role = normalizeUserRole(user.app_metadata?.role)
  if (role !== UserRoleEnum.ADMIN && role !== UserRoleEnum.ROOT) {
    logger.warn({ userId: user.id, role }, 'Unauthorized admin action attempt')
    throw new AuthError({
      code: ErrorCodes.auth.invalidCredentials(),
      message: 'Admin access required',
      context: { operation: 'requireAdminAction', userId: user.id },
      statusCode: 403,
    })
  }

  return { userId: user.id, role }
}
