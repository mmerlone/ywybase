'use client'

import * as React from 'react'

/**
 * The maximum width (in pixels) for a device to be considered mobile.
 * Devices with width below this value are treated as mobile devices.
 * @constant {number}
 * @default 768
 */
const MOBILE_BREAKPOINT = 768
const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT - 1}px)`

function getMobileSnapshot(): boolean {
  return window.matchMedia(MOBILE_MEDIA_QUERY).matches
}

function getServerSnapshot(): boolean {
  return false
}

function subscribeToMobileChange(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(MOBILE_MEDIA_QUERY)
  mql.addEventListener('change', onStoreChange)

  return (): void => {
    mql.removeEventListener('change', onStoreChange)
  }
}

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
  return React.useSyncExternalStore(subscribeToMobileChange, getMobileSnapshot, getServerSnapshot)
}
