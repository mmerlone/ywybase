/**
 * Type-Safe Navigation Utilities
 *
 * Provides type-safe navigation functions using the centralized route configuration.
 * Replaces direct string usage with type-checked route keys and parameters.
 */

import { useRouter as useNextRouter } from 'next/navigation'
import { ROUTES, type RouteKey, type RouteConfig } from '@/config/routes'
import { logger } from '@/lib/logger/client'

type RouteParams = Record<string, string>

function validateRouteParams(routePath: string, params?: Record<string, string>): void {
  // Extract required params from route path (e.g., "/users/:id" -> ["id"])
  const requiredParams = routePath.match(/:(\w+)/g)?.map((param) => param.slice(1)) ?? []

  // No required params and no params provided - valid
  if (requiredParams.length === 0) return

  // Check if all required params are provided in params object
  const missingParams = requiredParams.filter((param) => params === undefined || !(param in params))

  if (missingParams.length > 0) {
    throw new Error(`Missing required parameters: ${missingParams.join(', ')}`)
  }
}

function buildUrl(routeKey: RouteKey, params?: Record<string, string>, query?: Record<string, string>): string {
  const route = ROUTES[routeKey]
  if (route === undefined) {
    throw new Error(`Route "${String(routeKey)}" not found in ROUTES configuration`)
  }

  validateRouteParams(route.path, params)

  let url: string = route.path

  // Replace route parameters
  if (params !== undefined) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(value))
    })
  }

  // Add query parameters
  if (query !== undefined && Object.keys(query).length > 0) {
    const searchParams = new URLSearchParams()
    Object.entries(query).forEach(([key, value]) => {
      searchParams.append(key, value)
    })
    url += `?${searchParams.toString()}`
  }

  return url
}

export function useRouter(): ReturnType<typeof useNextRouter> & {
  push: (routeKey: RouteKey, params?: RouteParams, query?: Record<string, string>) => void
  replace: (routeKey: RouteKey, params?: RouteParams, query?: Record<string, string>) => void
  prefetch: (routeKey: RouteKey) => void
} {
  const router = useNextRouter()

  return {
    ...router,
    push: (routeKey: RouteKey, params?: RouteParams, query?: Record<string, string>): void => {
      try {
        const url = buildUrl(routeKey, params, query)
        return router.push(url)
      } catch (error) {
        logger.error({ error, operation: 'navigate', routeKey }, 'Navigation error')
        // Fallback to Next.js default behavior
        if (typeof routeKey === 'string') {
          return router.push(routeKey)
        }
        throw error
      }
    },
    replace: (routeKey: RouteKey, params?: RouteParams, query?: Record<string, string>): void => {
      try {
        const url = buildUrl(routeKey, params, query)
        return router.replace(url)
      } catch (error) {
        logger.error({ error, operation: 'replace', routeKey }, 'Navigation error')
        // Fallback to Next.js default behavior
        if (typeof routeKey === 'string') {
          return router.replace(routeKey)
        }
        throw error
      }
    },
    prefetch: (routeKey: RouteKey): void => {
      try {
        const url = buildUrl(routeKey)
        return router.prefetch(url)
      } catch (error) {
        logger.error({ error, operation: 'prefetch', routeKey }, 'Navigation error')
        // Fallback to Next.js default behavior
        if (typeof routeKey === 'string') {
          return router.prefetch(routeKey)
        }
        throw error
      }
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
  params?: Record<string, string>,
  query?: Record<string, string>
): string {
  let url: string = ROUTES[routeKey].path

  // Replace route parameters
  if (params !== undefined) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, encodeURIComponent(String(value)))
    })
  }

  // Add query parameters
  if (query !== undefined && Object.keys(query).length > 0) {
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
