/**
 * Flash Message Server Utilities
 *
 * Server-side utilities for setting flash messages in cookies.
 * This module should only be imported in Server Components, API routes, or middleware.
 */

import type { AlertColor } from '@mui/material'
import { cookies } from 'next/headers'
import { type NextRequest, type NextResponse } from 'next/server'

import { FLASH_COOKIE_NAME, FLASH_COOKIE_MAX_AGE } from './flash-messages.constants'
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
 * Set a flash message in cookies from API routes or Server Actions.
 * The message will be available on the next page load and auto-cleared after reading.
 *
 * @param response - NextResponse object to attach the cookie to
 * @param message - The message text to display
 * @param severity - Alert severity level (default: 'info')
 *
 * @example
 * ```typescript
 * // In an API route
 * const response = NextResponse.redirect('/profile');
 * setFlashMessage(response, 'Profile updated successfully!', 'success');
 * return response;
 * ```
 */
export function setFlashMessage(response: NextResponse, message: string, severity: AlertColor = 'info'): void {
  const flashData: FlashMessage = { message, severity }

  response.cookies.set(FLASH_COOKIE_NAME, JSON.stringify(flashData), {
    httpOnly: false, // Need to read from client
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FLASH_COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Retrieve and clear flash message from cookies in Server Components.
 * The cookie is automatically deleted after reading to ensure single consumption.
 *
 * @returns The flash message object or null if not found
 *
 * @example
 * ```typescript
 * // In a Server Component
 * const flash = await getFlashMessage();
 * if (flash) {
 *   // Pass to client component for display
 *   return <Alert message={flash.message} severity={flash.severity} />;
 * }
 * ```
 */
export async function getFlashMessage(): Promise<FlashMessage | null> {
  const cookieStore = await cookies()
  const flashCookie = cookieStore.get(FLASH_COOKIE_NAME)

  if (flashCookie?.value === undefined) {
    return null
  }

  const clearFlashCookie = (): void => {
    try {
      cookieStore.delete(FLASH_COOKIE_NAME)
    } catch {
      // In Server Components, cookies are read-only; client fallback will clear.
    }
  }

  try {
    const parsed = safeJsonParse<FlashMessage>(
      flashCookie.value,
      (obj): obj is FlashMessage =>
        typeof obj === 'object' &&
        obj !== null &&
        'message' in obj &&
        typeof (obj as Record<string, unknown>).message === 'string' &&
        'severity' in obj &&
        typeof (obj as Record<string, unknown>).severity === 'string'
    )

    if (parsed === null) {
      clearFlashCookie()
      return null
    }

    return parsed
  } catch {
    // Invalid JSON, clear cookie if possible
    clearFlashCookie()
    return null
  }
}

/**
 * Set a flash message within Next.js middleware.
 * Uses the middleware-specific NextRequest/NextResponse pattern.
 *
 * @param request - NextRequest object from middleware
 * @param response - NextResponse object to attach the cookie to
 * @param message - The message text to display
 * @param severity - Alert severity level (default: 'info')
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * const response = NextResponse.redirect('/login');
 * setFlashMessageInMiddleware(
 *   request,
 *   response,
 *   'Please log in to continue',
 *   'warning'
 * );
 * return response;
 * ```
 */
export function setFlashMessageInMiddleware(
  request: NextRequest,
  response: NextResponse,
  message: string,
  severity: AlertColor = 'info'
): void {
  const flashData: FlashMessage = { message, severity }

  response.cookies.set(FLASH_COOKIE_NAME, JSON.stringify(flashData), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FLASH_COOKIE_MAX_AGE,
    path: '/',
  })
}
