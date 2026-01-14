/**
 * Supabase Client-Side Client Factory
 *
 * Creates Supabase client instances for browser/client-side usage.
 * This module should only be imported in client components and client-side code.
 *
 * @remarks
 * Uses the @supabase/ssr package for proper cookie handling in Next.js App Router.
 * Automatically configures the client with environment variables.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'

import { getSupabaseConfig } from '@/config/supabase'
import { ConfigurationError } from '@/lib/error/errors'
import { ErrorCodes } from '@/lib/error/codes'
import type { Database } from '@/types/supabase'

/**
 * Create a Supabase client for browser-side usage.
 * Configured for client components and client-side code.
 *
 * @returns Configured Supabase client with type-safe database schema
 * @throws {ConfigurationError} If Supabase configuration is invalid or environment variables are missing
 *
 * @example
 * ```typescript
 * 'use client'
 *
 * import { createClient } from '@/lib/supabase/client'
 *
 * export function MyClientComponent() {
 *   const supabase = createClient()
 *
 *   async function fetchData() {
 *     const { data } = await supabase.from('profiles').select('*')
 *     return data
 *   }
 * }
 * ```
 */
export function createClient(): SupabaseClient<Database> {
  try {
    const config = getSupabaseConfig()

    return createBrowserClient<Database>(config.url, config.publishableKey)
  } catch (error) {
    // Convert generic error to ConfigurationError
    throw new ConfigurationError({
      code: ErrorCodes.config.missingEnvVar(),
      message: 'Supabase configuration is invalid. Please check your environment variables.',
      context: {
        originalError: error instanceof Error ? error.message : String(error),
      },
      statusCode: 500,
      cause: error instanceof Error ? error : undefined,
    })
  }
}
