import { type NextRequest } from 'next/server'
import { type User } from '@supabase/supabase-js'
import { type MiddlewareResult } from './utils/types'
import { PROTECTED_PATHS, ADMIN_PATHS, type RouteConfig } from '@/config/routes'
import { UserRoleEnum } from '../types/admin.types'
import { normalizeUserRole } from '@/lib/utils/role-utils'
import { isSameOrSubpath } from '@/lib/utils/paths'

export async function authorizeRequest(
  request: NextRequest,
  user: User | null,
  routeConfig: RouteConfig | null
): Promise<MiddlewareResult> {
  const { pathname } = request.nextUrl

  // 1. Basic path protection check
  const isProtected = PROTECTED_PATHS.some((path: string) => isSameOrSubpath(pathname, path))
  const isAdminPath = ADMIN_PATHS.some((path: string) => isSameOrSubpath(pathname, path))

  if (!isProtected && routeConfig?.protected !== true) {
    return { allowed: true }
  }

  // 2. Check if user is authenticated
  if (!user) {
    return {
      allowed: false,
      redirect: '/auth?redirectedFrom=' + encodeURIComponent(pathname),
    }
  }

  // 3. Check role requirements
  const roles = routeConfig?.roles ?? []
  const rawRole = user.app_metadata?.role as unknown
  const userRole = normalizeUserRole(typeof rawRole === 'string' ? rawRole : undefined)

  if (isAdminPath) {
    if (typeof userRole !== 'string' || (userRole !== UserRoleEnum.ROOT && userRole !== UserRoleEnum.ADMIN)) {
      return { allowed: false, error: new Error('Forbidden: Admin access required') }
    }
  }

  // ROOT role has access to all roles, ADMIN has access to admin routes
  if (roles.length > 0) {
    const hasAccess =
      userRole === UserRoleEnum.ROOT ||
      roles.includes(userRole) ||
      (userRole === UserRoleEnum.ADMIN && roles.includes(UserRoleEnum.ADMIN))
    if (!hasAccess) {
      return { allowed: false, error: new Error('Forbidden: Insufficient permissions') }
    }
  }

  // 4. Check custom permissions if specified in routeConfig
  // ... future implementation ...

  return { allowed: true }
}
