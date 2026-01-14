/**
 * Supabase Client Exports
 *
 * Main entry point for all Supabase-related functionality.
 * Provides clear exports for both client and server-side usage.
 *
 * @remarks
 * Import patterns:
 * - Client-side: `import { createClient } from '@/lib/supabase/client'`
 * - Server-side: `import { createClient, createAdminClient } from '@/lib/supabase/server'`
 * - Middleware: `import { updateSession } from '@/lib/supabase/middleware'`
 *
 * @module supabase
 */

// Middleware
/** Session management for Next.js middleware */
export { updateSession } from './middleware'

// Re-export types for convenience
/** Supabase database type definitions */
export type { Database } from '@/types/supabase'
