/**
 * Centralized Route Configuration
 *
 * Single source of truth for all application routes with their protection requirements.
 * Routes not defined in ROUTES will be implicitly public.
 */

import { UserRoleEnum, type UserRole } from '@/types/admin.types'

// Route interfaces
interface BaseRoute {
  path: string
  title: string
}

/**
 * Unified route configuration interface for internal usage
 * contains all possible properties as optional for safe access.
 */
export interface RouteConfig extends BaseRoute {
  public?: boolean
  protected?: boolean
  requireVerifiedEmail?: boolean
  redirectIfAuthenticated?: string
  roles?: readonly UserRole[]
}

/**
 * Minimal link shape for navigation items that need role-based filtering.
 */
export interface RouteLinkItem {
  /** Path or URL for the navigation destination. */
  link: string
}

/**
 * Centralized route configuration object.
 *
 * Routes not defined in this object are public by default and do not require authentication.
 * Each route can specify protection requirements, roles, and redirection behavior.
 *
 * @example
 * ```typescript
 * // Public route example (routes omitted here are public by default)
 * HOME: {
 *   path: '/',
 *   title: 'Home',
 *   public: true,
 * },
 * ```
 */
export const ROUTES = {
  // Public routes
  HOME: {
    path: '/',
    title: 'Home',
    public: true,
  },
  ABOUT: {
    path: '/about',
    title: 'About',
    public: true,
  },

  // Demo routes
  DEMOS: {
    path: '/demos',
    title: 'Demos',
    public: true,
  },

  // Auth routes
  AUTH: {
    path: '/auth',
    title: 'Login',
    public: true,
    redirectIfAuthenticated: '/profile',
  },

  // Protected routes
  PROFILE: {
    path: '/profile',
    title: 'Profile',
    protected: true,
    requireVerifiedEmail: false,
    roles: [UserRoleEnum.USER] as readonly UserRole[],
  },
  ACCOUNT: {
    path: '/account',
    title: 'Account',
    protected: true,
    requireVerifiedEmail: false,
    roles: [UserRoleEnum.USER] as readonly UserRole[],
  },
  // Future implementation
  DASHBOARD: {
    path: '/dashboard',
    title: 'Dashboard',
    protected: true,
    requireVerifiedEmail: false,
    roles: [UserRoleEnum.ADMIN, UserRoleEnum.ROOT] as readonly UserRole[],
  },
  DASHBOARD_USERS: {
    path: '/dashboard/users',
    title: 'User Management',
    protected: true,
    requireVerifiedEmail: false,
    roles: [UserRoleEnum.ADMIN, UserRoleEnum.ROOT] as readonly UserRole[],
  },
  SETTINGS: {
    path: '/settings',
    title: 'Settings',
    protected: true,
    requireVerifiedEmail: false,
    roles: [UserRoleEnum.USER] as readonly UserRole[],
  },

  // Future implementation - Admin routes
  ADMIN: {
    path: '/admin',
    title: 'Admin',
    protected: true,
    requireVerifiedEmail: true,
    roles: [UserRoleEnum.ADMIN, UserRoleEnum.ROOT] as readonly UserRole[],
  },
} satisfies Record<string, RouteConfig>

// Type helpers
export type RoutePath = (typeof ROUTES)[keyof typeof ROUTES]['path']
export type RouteKey = keyof typeof ROUTES

export type ProtectedRouteKey = {
  [K in keyof typeof ROUTES]: (typeof ROUTES)[K] extends { protected: true } ? K : never
}[keyof typeof ROUTES]

export type AuthRouteKey = {
  [K in keyof typeof ROUTES]: (typeof ROUTES)[K] extends { redirectIfAuthenticated: string } ? K : never
}[keyof typeof ROUTES]

// Helper functions
export const isProtectedRoute = (routeKey: RouteKey): routeKey is ProtectedRouteKey => {
  return (ROUTES[routeKey] as RouteConfig).protected === true
}

export const isAuthRoute = (routeKey: RouteKey): routeKey is AuthRouteKey => {
  return typeof (ROUTES[routeKey] as RouteConfig).redirectIfAuthenticated === 'string'
}

export const getRouteByKey = (key: RouteKey): RouteConfig => {
  return ROUTES[key] as RouteConfig
}

export const getRouteByPath = (path: string): RouteConfig | null => {
  const route = (Object.values(ROUTES) as RouteConfig[]).find((r) => path === r.path || path.startsWith(r.path + '/'))
  return route ?? null
}

/**
 * Filter navigation items based on role requirements from the route config.
 *
 * @param items - Navigation items containing a link destination.
 * @param role - Normalized user role enum value.
 * @returns Filtered navigation items visible to the provided role.
 */
export const filterNavItemsByRole = <T extends RouteLinkItem>(items: readonly T[], role: UserRole): T[] => {
  return items.filter((item) => {
    if (!item.link.startsWith('/')) return true

    const routeConfig = getRouteByPath(item.link)
    const roles = routeConfig?.roles ?? []

    // Guest role: only show public/unprotected routes
    if (role === UserRoleEnum.GUEST) {
      // If route is public or has no roles, allow
      if (routeConfig?.public === true || roles.length === 0) return true
      return false
    }

    if (roles.length === 0) return true
    if (role === UserRoleEnum.ROOT) return true

    return roles.includes(role)
  })
}

// Arrays of routes by type - using simple filtering
const ALL_ROUTES = Object.values(ROUTES) as RouteConfig[]

export const PROTECTED_ROUTES = ALL_ROUTES.filter((route) => route.protected === true)
export const AUTH_ROUTES = ALL_ROUTES.filter((route) => typeof route.redirectIfAuthenticated === 'string')
export const VERIFIED_EMAIL_REQUIRED_ROUTES = ALL_ROUTES.filter(
  (route) => route.protected === true && route.requireVerifiedEmail === true
)

// Path arrays for middleware
export const PROTECTED_PATHS = PROTECTED_ROUTES.map((route) => route.path)
export const AUTH_PATHS = AUTH_ROUTES.map((route) => route.path)
export const VERIFIED_EMAIL_REQUIRED_PATHS = VERIFIED_EMAIL_REQUIRED_ROUTES.map((route) => route.path)
export const ADMIN_PATHS = ALL_ROUTES.filter(
  (route) => (route.roles?.includes(UserRoleEnum.ADMIN) ?? false) || (route.roles?.includes(UserRoleEnum.ROOT) ?? false)
).map((route) => route.path)
