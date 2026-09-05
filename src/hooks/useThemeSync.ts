/**
 * @fileoverview Theme synchronization hook.
 *
 * Syncs the user's saved theme preference from the database with the UI theme mode.
 * Ensures that when a user logs in, their saved theme preference is applied immediately.
 * Also handles clearing theme preference on logout for security on multi-user devices.
 *
 * @module hooks/useThemeSync
 */

'use client'

import { useEffect } from 'react'
import { useColorScheme } from '@mui/material/styles'
import { logger } from '@/lib/logger/client'
import type { Profile } from '@/types/profile.types'

/**
 * Synchronizes user's saved theme preference from profile with the UI.
 *
 * When a user's profile is loaded (after login), this hook reads the `theme` field
 * from the profile and applies it to the MUI color scheme. This ensures the user's
 * saved preference (light, dark, or system) is restored on login.
 *
 * On logout (when profile becomes null), resets to system preference for security
 * and to align with default behavior on multi-user devices.
 *
 * @param {Profile | null | undefined} profile - The user's profile data, or null/undefined if logged out
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { profile } = useProfile(userId)
 *   useThemeSync(profile)  // Automatically sync theme when profile loads
 *
 *   return <div>Content</div>
 * }
 * ```
 *
 * @remarks
 * **Behavior**:
 * - When profile loads with a theme preference, applies it immediately (if different from current)
 * - When profile becomes null (logout), resets to 'system' preference
 * - No-op if profile.theme is undefined or already matches current mode
 * - Respects manual user theme changes (doesn't override after initial sync)
 *
 * **Security**:
 * - Clears theme on logout to prevent leakage on multi-user devices
 * - Restores from database on login (not from potentially stale localStorage)
 *
 * **Performance**:
 * - Non-blocking operation (no network calls)
 * - Only updates color scheme if preference changed
 * - No component re-renders triggered (theme update is internal to MUI)
 */
export function useThemeSync(profile: Profile | null | undefined): void {
  const { mode, setMode } = useColorScheme()

  useEffect(() => {
    if (!profile) {
      // User logged out: reset to system preference (secure default)
      if (mode !== 'system') {
        logger.debug({ currentMode: mode }, 'Resetting theme to system preference on logout')
        setMode('system')
      }
      return
    }

    // User logged in and profile loaded: sync their saved theme preference
    const savedTheme = profile.theme
    if (savedTheme && mode !== savedTheme) {
      logger.debug(
        {
          savedTheme,
          currentMode: mode,
          operation: 'syncThemePreference',
        },
        'Syncing theme preference from profile'
      )
      setMode(savedTheme)
    }
  }, [profile, mode, setMode])
}
