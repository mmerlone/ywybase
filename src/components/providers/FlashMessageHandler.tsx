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

import { useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { flashClient, type FlashMessage } from '@/lib/utils/flash-messages.client'

/**
 * Props for FlashMessageHandler.
 */
interface FlashMessageHandlerProps {
  /** Optional initial flash message provided by server rendering. */
  initialFlash?: FlashMessage | null
}

export function FlashMessageHandler({ initialFlash }: FlashMessageHandlerProps): null {
  const { showSuccess, showError, showWarning, showInfo } = useSnackbar()
  const pathname = usePathname()
  const initialConsumedRef = useRef(false)
  const pollTimeoutRef = useRef<number | null>(null)

  const showFlashMessage = useCallback(
    (flashMessage: FlashMessage): void => {
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
    },
    [showSuccess, showError, showWarning, showInfo]
  )

  const checkForFlash = useCallback((): void => {
    if (initialFlash && !initialConsumedRef.current) {
      initialConsumedRef.current = true
      showFlashMessage(initialFlash)
      flashClient.clear()
      return
    }

    const flashMessage = flashClient.get()

    if (!flashMessage) return

    showFlashMessage(flashMessage)
    flashClient.clear()
  }, [initialFlash, showFlashMessage])

  const scheduleFlashPoll = useCallback((): void => {
    if (pollTimeoutRef.current !== null) {
      return
    }

    let attempts = 0
    const maxAttempts = 12
    const intervalMs = 100

    const poll = (): void => {
      attempts += 1
      const flashMessage = flashClient.get()

      if (flashMessage) {
        showFlashMessage(flashMessage)
        flashClient.clear()
        pollTimeoutRef.current = null
        return
      }

      if (attempts < maxAttempts) {
        pollTimeoutRef.current = window.setTimeout(poll, intervalMs)
        return
      }

      pollTimeoutRef.current = null
    }

    pollTimeoutRef.current = window.setTimeout(poll, intervalMs)
  }, [showFlashMessage])

  useEffect(() => {
    checkForFlash()
  }, [checkForFlash, pathname])

  useEffect(() => {
    const handleClick = (): void => {
      window.setTimeout(() => {
        checkForFlash()
        scheduleFlashPoll()
      }, 50)
    }

    const handlePopState = (): void => {
      checkForFlash()
      scheduleFlashPoll()
    }

    document.addEventListener('click', handleClick)
    window.addEventListener('popstate', handlePopState)

    return (): void => {
      document.removeEventListener('click', handleClick)
      window.removeEventListener('popstate', handlePopState)
      if (pollTimeoutRef.current !== null) {
        window.clearTimeout(pollTimeoutRef.current)
      }
    }
  }, [checkForFlash, scheduleFlashPoll])

  return null
}
