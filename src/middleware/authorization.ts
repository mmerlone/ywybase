import { NextRequest } from 'next/server'
import { User } from '@supabase/supabase-js'
import { MiddlewareResult } from './utils/types'
import { PROTECTED_PATHS, ADMIN_PATHS, RouteConfig } from '@/config/routes'

function normalizeRole(role: string): string {
  if (role === 'authenticated') {
    return 'user'
  }

  if (role === 'supabase_admin') {
    return 'admin'
  }

  return role
}

export async function authorizeRequest(
  request: NextRequest,
  user: User | null,
  routeConfig: RouteConfig | null
): Promise<MiddlewareResult> {
  const { pathname } = request.nextUrl

  // 1. Basic path protection check
  const isProtected = PROTECTED_PATHS.some((path: string) => pathname === path || pathname.startsWith(path + '/'))
  const isAdminPath = ADMIN_PATHS.some((path: string) => pathname === path || pathname.startsWith(path + '/'))

  if (!isProtected && (!routeConfig || routeConfig.protected !== true)) {
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
  const rawRole = user.app_metadata?.role ?? (user as User & { role?: string }).role ?? 'user'
  const userRole = normalizeRole(rawRole)

  if (isAdminPath) {
    if (typeof userRole !== 'string' || userRole !== 'admin') {
      return { allowed: false, error: new Error('Forbidden: Admin access required') }
    }
  }

  if (roles.length > 0 && !roles.includes(userRole as string)) {
    return { allowed: false, error: new Error('Forbidden: Insufficient permissions') }
  }

  // 4. Check custom permissions if specified in routeConfig
  // ... future implementation ...

  return { allowed: true }
}
