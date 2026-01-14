/**
 * Flash Message Utilities
 *
 * Handles temporary notifications that survive server-side redirects.
 * Uses cookies to store messages that are consumed once and cleared.
 *
 * This is cleaner than URL parameters because:
 * - Not visible in URL
 * - Can't be bookmarked or shared with notification
 * - Automatically cleared after being read
 * - More secure
 *
 * NOTE: This file re-exports from client and server modules.
 * In client components, import from './flash-messages.client'
 * In server components, import from './flash-messages.server'
 */

// Re-export types
export type { FlashMessage } from './flash-messages.client'

// Re-export server utilities (only works in server context)
export { setFlashMessage, getFlashMessage, setFlashMessageInMiddleware } from './flash-messages.server'

// Re-export client utilities (only works in client context)
export { flashClient } from './flash-messages.client'
