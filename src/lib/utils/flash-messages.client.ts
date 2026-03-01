/**
 * Flash Message Client Utilities
 *
 * Client-side utilities for reading and clearing flash messages from cookies.
 * This module can be safely imported in client components.
 */

import type { AlertColor } from '@mui/material'

import { FLASH_COOKIE_NAME } from './flash-messages.constants'
import { safeJsonParse } from './json'

/**
 * Flash message data structure.
 * Contains a message string and severity level for UI display.
 */
export interface FlashMessage {
  /** The message text to display */
  message: string
  /** Severity level determining the alert color/style */
  severity: AlertColor
}

/**
 * Client-side utilities for flash messages.
 * Provides methods to read and clear messages from cookies.
 *
 * @example
 * ```typescript
 * // In a client component
 * const message = flashClient.get();
 * if (message) {
 *   console.log(message.message, message.severity);
 *   flashClient.clear();
 * }
 * ```
 */
export const flashClient = {
  /**
   * Retrieve flash message from cookies on the client side.
   * Returns null if no message exists or if parsing fails.
   *
   * @returns The flash message object or null if not found
   *
   * @example
   * ```typescript
   * const flash = flashClient.get();
   * if (flash) {
   *   showAlert(flash.message, flash.severity);
   * }
   * ```
   */
  get(): FlashMessage | null {
    if (typeof document === 'undefined') return null

    const cookies = document.cookie.split(';')
    const flashCookie = cookies.find((c) => c.trim().startsWith(`${FLASH_COOKIE_NAME}=`))

    if (flashCookie === undefined) return null

    try {
      const equalIndex = flashCookie.indexOf('=')
      if (equalIndex === -1) return null

      const value = flashCookie.substring(equalIndex + 1).trim()
      if (!value || value.length === 0) return null

      const parsed = safeJsonParse<FlashMessage>(
        decodeURIComponent(value),
        (obj): obj is FlashMessage =>
          typeof obj === 'object' &&
          obj !== null &&
          'message' in obj &&
          typeof (obj as Record<string, unknown>).message === 'string' &&
          'severity' in obj &&
          typeof (obj as Record<string, unknown>).severity === 'string'
      )
      return parsed
    } catch {
      return null
    }
  },

  /**
   * Clear the flash message cookie on the client side.
   * Should be called after displaying the message to prevent showing it again.
   *
   * @example
   * ```typescript
   * // After displaying the message
   * flashClient.clear();
   * ```
   */
  clear(): void {
    if (typeof document === 'undefined') return

    document.cookie = `${FLASH_COOKIE_NAME}=; path=/; max-age=0`
  },
}
