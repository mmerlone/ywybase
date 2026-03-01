'use client'

import * as React from 'react'

/**
 * The maximum width (in pixels) for a device to be considered mobile.
 * Devices with width below this value are treated as mobile devices.
 * @constant {number}
 * @default 768
 */
const MOBILE_BREAKPOINT = 768

/**
 * Mobile viewport detection hook using matchMedia API.
 *
 * This hook efficiently detects whether the current viewport width is below the
 * mobile breakpoint (768px) and updates reactively when the viewport is resized.
 * It's safe for server-side rendering and handles hydration properly.
 *
 * @returns {boolean} `true` if viewport is mobile-sized (width < 768px), `false` otherwise
 *
 * @example
 * ```tsx
 * function ResponsiveComponent() {
 *   const isMobile = useIsMobile();
 *
 *   return (
 *     <div>
 *       {isMobile ? (
 *         <MobileNavigation />
 *       ) : (
 *         <DesktopNavigation />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function Dashboard() {
 *   const isMobile = useIsMobile();
 *   return isMobile ? <MobileDashboard /> : <DesktopDashboard />;
 * }
 * ```
 *
 * @remarks
 * - Uses 768px breakpoint (standard tablet/mobile boundary)
 * - Efficient matchMedia API for viewport detection
 * - Automatic updates on viewport resize
 * - Server-side rendering safe
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = (): void => {
      setIsMobile(mql.matches)
    }
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    const cleanup = (): void => {
      mql.removeEventListener('change', onChange)
    }
    return cleanup
  }, [])

  return Boolean(isMobile)
}
