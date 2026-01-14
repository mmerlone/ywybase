/**
 * Type-Safe Navigation Utilities
 *
 * Provides type-safe navigation functions using the centralized route configuration.
 * Replaces direct string usage with type-checked route keys and parameters.
 */

import { useRouter as useNextRouter } from 'next/navigation'
import { ROUTES, type RouteKey, type RouteConfig } from '@/config/routes'

type RouteParams<T> = T extends `${string}:${infer P}/${infer R}`
  ? { [K in P | keyof RouteParams<`${R}`>]: string }
  : T extends `${string}:${infer P}`
    ? { [K in P]: string }
    : Record<string, never>

export function useRouter(): ReturnType<typeof useNextRouter> & {
  push: <T extends RouteKey>(
    routeKey: T,
    params?: RouteParams<(typeof ROUTES)[T]['path']>,
    query?: Record<string, string>
  ) => void
  replace: <T extends RouteKey>(
    routeKey: T,
    params?: RouteParams<(typeof ROUTES)[T]['path']>,
    query?: Record<string, string>
  ) => void
} {
  const router = useNextRouter()

  return {
    ...router,
    push: <T extends RouteKey>(
      routeKey: T,
      params?: RouteParams<(typeof ROUTES)[T]['path']>,
      query?: Record<string, string>
    ): void => {
      let url: string = ROUTES[routeKey].path

      // Replace route parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, encodeURIComponent(value))
        })
      }

      // Add query parameters
      if (query) {
        const searchParams = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
          searchParams.append(key, value)
        })
        url += `?${searchParams.toString()}`
      }

      return router.push(url)
    },
    replace: <T extends RouteKey>(
      routeKey: T,
      params?: RouteParams<(typeof ROUTES)[T]['path']>,
      query?: Record<string, string>
    ): void => {
      let url: string = ROUTES[routeKey].path

      // Replace route parameters
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          url = url.replace(`:${key}`, encodeURIComponent(value))
        })
      }

      // Add query parameters
      if (query) {
        const searchParams = new URLSearchParams()
        Object.entries(query).forEach(([key, value]) => {
          searchParams.append(key, value)
        })
        url += `?${searchParams.toString()}`
      }

      return router.replace(url)
    },
  }
}

/**
 * Get a route path by key with optional parameters.
 * Replaces route parameters and adds query strings as needed.
 *
 * @param routeKey - The route identifier from ROUTES configuration
 * @param params - Optional parameters to replace in the route path
 * @param query - Optional query parameters to append
 * @returns The complete route path as a string
 *
 * @example
 * ```typescript
 * const path = getRoutePath('USER_PROFILE', { id: '123' }, { tab: 'settings' });
 * // Returns: '/users/123?tab=settings'
 * ```
 */
export function getRoutePath<T extends RouteKey>(
  routeKey: T,
  params?: RouteParams<(typeof ROUTES)[T]['path']>,
  query?: Record<string, string>
): string {
  let url: string = ROUTES[routeKey].path

  // Replace route parameters
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value))
    })
  }

  // Add query parameters
  if (query && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      searchParams.append(key, value)
    })
    url += `?${searchParams.toString()}`
  }

  return url
}

/**
 * Check if a given path matches a specific route key.
 * Supports route parameters (e.g., :id) by converting them to regex patterns.
 *
 * @param path - The path to check
 * @param routeKey - The route key to match against
 * @returns True if the path matches the route pattern
 *
 * @example
 * ```typescript
 * isRoutePath('/users/123', 'USER_PROFILE'); // true
 * isRoutePath('/about', 'USER_PROFILE'); // false
 * ```
 */
export function isRoutePath(path: string, routeKey: RouteKey): boolean {
  const routePath = ROUTES[routeKey].path
  // Escape regex metacharacters in the route path first
  const escapedPath = routePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Convert route pattern to regex: /users/:id -> /users/[^/]+
  const pattern = escapedPath.replace(/:[^/]+/g, '[^/]+')
  const regex = new RegExp(`^${pattern}($|\\?|/)`)
  return regex.test(path)
}

/**
 * Get the display title for a route by its key.
 *
 * @param routeKey - The route identifier from ROUTES configuration
 * @returns The human-readable title for the route
 *
 * @example
 * ```typescript
 * const title = getRouteTitle('USER_PROFILE'); // Returns: 'Profile'
 * ```
 */
export function getRouteTitle(routeKey: RouteKey): string {
  return ROUTES[routeKey].title
}

/**
 * Get all protected route paths that require authentication.
 *
 * @returns Array of route paths that have `protected: true`
 *
 * @example
 * ```typescript
 * const protected = getProtectedPaths();
 * // Returns: ['/profile', '/settings', ...]
 * ```
 */
export function getProtectedPaths(): string[] {
  return (Object.values(ROUTES) as RouteConfig[]).filter((route) => route.protected === true).map((route) => route.path)
}

/**
 * Get all authentication route paths.
 * These are public routes that redirect authenticated users elsewhere.
 *
 * @returns Array of auth route paths (e.g., login, signup)
 *
 * @example
 * ```typescript
 * const authPaths = getAuthPaths();
 * // Returns: ['/login', '/signup', ...]
 * ```
 */
export function getAuthPaths(): string[] {
  return (Object.values(ROUTES) as RouteConfig[])
    .filter((route) => route.public === true && typeof route.redirectIfAuthenticated === 'string')
    .map((route) => route.path)
}
