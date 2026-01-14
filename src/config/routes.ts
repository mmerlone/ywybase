/**
 * Centralized Route Configuration
 *
 * Single source of truth for all application routes with their protection requirements.
 * Routes not defined in ROUTES will be implicitly public.
 */

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
  roles?: readonly string[]
}

export const ROUTES = {
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
    roles: ['user'] as readonly string[],
  },
  ACCOUNT: {
    path: '/account',
    title: 'Account',
    protected: true,
    requireVerifiedEmail: false,
    roles: ['user'] as readonly string[],
  },
  // Future implementation
  DASHBOARD: {
    path: '/dashboard',
    title: 'Dashboard',
    protected: true,
    requireVerifiedEmail: false,
    roles: ['user'] as readonly string[],
  },
  SETTINGS: {
    path: '/settings',
    title: 'Settings',
    protected: true,
    requireVerifiedEmail: false,
    roles: ['user'] as readonly string[],
  },

  // Future implementation - Admin routes
  ADMIN: {
    path: '/admin',
    title: 'Admin',
    protected: true,
    requireVerifiedEmail: true,
    roles: ['admin'] as readonly string[],
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
  const route = (Object.values(ROUTES) as RouteConfig[]).find(
    (route) => path === route.path || path.startsWith(route.path + '/')
  )
  return route || null
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
export const ADMIN_PATHS = ALL_ROUTES.filter((route) => route.roles?.includes('admin')).map((route) => route.path)
