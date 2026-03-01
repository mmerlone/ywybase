import { useMemo } from 'react'
import { usePathname } from 'next/navigation'

/**
 * Represents a single breadcrumb navigation item.
 * @interface BreadcrumbItem
 */
export interface BreadcrumbItem {
  /** Display text for the breadcrumb */
  label: string
  /** URL path for the breadcrumb link (empty for current page) */
  href: string
}

/**
 * Mapping of route segments to user-friendly breadcrumb labels.
 * @constant
 */
const breadcrumbLabels: Record<string, string> = {
  about: 'About',
  profile: 'Profile',
  cookies: 'Cookies',
  copyright: 'Copyright',
  error: 'Error',
  privacy: 'Privacy',
  terms: 'Terms of Service',
  auth: 'Authentication',
}

/**
 * Breadcrumb navigation hook that generates breadcrumb items based on current route.
 *
 * This hook automatically generates a hierarchical breadcrumb trail from the current
 * pathname. It intelligently formats segment names and supports custom labels via the
 * breadcrumbLabels map. The last item in the breadcrumbs represents the current page
 * and has an empty href.
 *
 * @returns {BreadcrumbItem[]} Array of breadcrumb items from home to current page
 *
 * @example
 * ```tsx
 * function Breadcrumbs() {
 *   const breadcrumbs = useBreadcrumbs();
 *
 *   return (
 *     <nav>
 *       {breadcrumbs.map((item, index) => (
 *         <span key={item.href || index}>
 *           {item.href ? (
 *             <Link href={item.href}>{item.label}</Link>
 *           ) : (
 *             <span>{item.label}</span>
 *           )}
 *           {index < breadcrumbs.length - 1 && ' > '}
 *         </span>
 *       ))}
 *     </nav>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // For route: /profile/settings
 * // Returns:
 * // [
 * //   { label: 'Home', href: '/' },
 * //   { label: 'Profile', href: '/profile' },
 * //   { label: 'Settings', href: '' } // Current page
 * // ]
 * ```
 *
 * @remarks
 * - Returns empty array for home page ('/') to hide breadcrumbs
 * - Uses breadcrumbLabels map for custom labels, falls back to capitalized segment
 * - Current page (last item) has empty href to indicate it's not clickable
 * - Automatically filters out empty segments
 * - Memoized for performance - only recalculates when pathname changes
 */
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname()

  return useMemo(() => {
    // Don't show breadcrumbs on home page
    if (pathname === '/') {
      return []
    }

    const segments = pathname.split('/').filter((segment) => segment.length > 0)
    const breadcrumbs: BreadcrumbItem[] = [
      {
        label: 'Home',
        href: '/',
      },
    ]

    let currentPath = ''
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`

      // Get label from map or use formatted segment as fallback
      const label = breadcrumbLabels[segment] ?? segment.charAt(0).toUpperCase() + segment.slice(1)

      // Only add if not the last segment (last segment is current page)
      if (index < segments.length - 1) {
        breadcrumbs.push({
          label,
          href: currentPath,
        })
      } else {
        // For last segment, add without href (current page)
        breadcrumbs.push({
          label,
          href: '',
        })
      }
    })

    return breadcrumbs
  }, [pathname])
}
