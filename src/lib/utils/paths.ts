/**
 * @fileoverview Path utility helpers.
 *
 * Shared utilities for matching and validating application paths.
 *
 * @module lib/utils/paths
 */

/**
 * Check whether a pathname matches a route path or any of its subpaths.
 *
 * @param pathname - Full request pathname (e.g., `/dashboard/users`)
 * @param path - Route path to check against (e.g., `/dashboard`)
 * @returns True when pathname matches path or is a subpath
 */
export function isSameOrSubpath(pathname: string, path: string): boolean {
  return pathname === path || pathname.startsWith(path + '/')
}
