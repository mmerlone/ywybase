/**
 * Logger Module - Main Entry Point
 *
 * Provides explicit imports for client and server loggers.
 * No automatic detection to avoid bundling issues and ensure tree-shaking.
 *
 * @remarks
 * **Important**: Always import the specific logger you need:
 * - Use `clientLogger` in client components
 * - Use `serverLogger` in server components and API routes
 * - Use `buildIsomorphicLogger` only for shared utilities
 *
 * **Why Explicit Imports**:
 * - Better tree-shaking (unused code is removed)
 * - Prevents bundling server code in client
 * - Clearer intent and easier debugging
 *
 * @module logger
 */

// Export environment-specific loggers explicitly
export { logger as clientLogger, buildLogger as buildClientLogger } from './client'
export { logger as serverLogger, buildLogger as buildServerLogger } from './server'

/**
 * Check if code is running in browser environment.
 *
 * @returns True if running in browser (client-side)
 *
 * @example
 * ```typescript
 * if (isClient()) {
 *   console.log('Running in browser')
 * }
 * ```
 */
export const isClient = (): boolean => typeof window !== 'undefined'

/**
 * Check if code is running in Node.js environment.
 *
 * @returns True if running in Node.js (server-side)
 *
 * @example
 * ```typescript
 * if (isServer()) {
 *   // Safe to use Node.js APIs
 *   const fs = require('fs')
 * }
 * ```
 */
export const isServer = (): boolean => typeof window === 'undefined'

// Export types
export type { Logger, LoggerContext } from '@/types/logger.types'

// Note: No default logger export to prevent auto-detection issues
