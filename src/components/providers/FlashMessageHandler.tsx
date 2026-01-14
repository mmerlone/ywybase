/**
 * @fileoverview Flash message handler component for displaying server-side notifications.
 *
 * This module provides a global notification handler that reads flash messages
 * from cookies and displays them using the Snackbar system. Flash messages are
 * temporary notifications set by server-side code that survive redirects.
 *
 * @module components/providers/FlashMessageHandler
 */

/**
 * Global flash message handler component.
 *
 * This component automatically detects and displays flash messages stored in cookies
 * by server-side code (API routes, Server Actions, middleware). Flash messages are
 * temporary notifications that survive redirects and are automatically cleared after
 * being displayed once.
 *
 * @returns {null} This component doesn't render any UI, returns null
 *
 * @example
 * ```tsx
 * // In root layout
 * function RootLayout({ children }) {
 *   return (
 *     <SnackbarProvider>
 *       <FlashMessageHandler />
 *       {children}
 *     </SnackbarProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Server-side: Set a flash message
 * import { flashServer } from '@/lib/utils/flash-messages.server';
 *
 * export async function serverAction() {
 *   await someOperation();
 *   flashServer.set('Operation completed successfully!', 'success');
 *   redirect('/dashboard');
 * }
 * ```
 *
 * @remarks
 * **Advantages over URL parameters**:
 * - Not visible in URL
 * - Can't be bookmarked or shared
 * - Automatically cleared after reading
 * - More secure
 *
 * Place this component inside SnackbarProvider in the root layout.
 */
'use client'

import { useEffect } from 'react'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { flashClient } from '@/lib/utils/flash-messages.client'

export function FlashMessageHandler(): null {
  const { showSuccess, showError, showWarning, showInfo } = useSnackbar()

  useEffect(() => {
    const flashMessage = flashClient.get()

    if (!flashMessage) return

    // Show the notification based on severity
    switch (flashMessage.severity) {
      case 'success':
        showSuccess(flashMessage.message)
        break
      case 'error':
        showError(flashMessage.message)
        break
      case 'warning':
        showWarning(flashMessage.message)
        break
      case 'info':
        showInfo(flashMessage.message)
        break
    }

    // Clear the flash message after showing
    flashClient.clear()
  }, [showSuccess, showError, showWarning, showInfo])

  return null
}
