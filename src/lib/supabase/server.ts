'use server'

import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

import { getSupabaseConfig } from '@/config/supabase'
import { ConfigurationError } from '@/lib/error/errors'
import { ErrorCodes } from '@/lib/error/codes'
import { logger } from '@/lib/logger/server'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for server-side usage (Server Components and Server Actions).
 *
 * @returns Configured Supabase client
 *
 * @example
 * ```typescript
 * // In a Server Action or API route
 * const supabase = await createClient()
 * const { data } = await supabase.from('profiles').select('*')
 * ```
 *
 * @throws {ConfigurationError} If Supabase configuration is invalid
 */
export const createClient = async (): Promise<SupabaseClient<Database>> => {
  try {
    const config = getSupabaseConfig()
    const cookieStore = await cookies()

    return createServerClient<Database>(config.url, config.publishableKey, {
      auth: {
        // PKCE is required for email-link flows (sign-up verification, password reset).
        // @supabase/ssr routes the code verifier through the cookies adapter below,
        // so no custom auth.storage override is needed (and would break session longevity).
        flowType: 'pkce',
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (err) {
            // setAll is called from a Server Component — cookie writes are ignored.
            // Middleware handles session refresh for the next request.
            logger.warn({ err }, 'Supabase cookie set failed (ignorable in Server Components)')
          }
        },
      },
    })
  } catch (error) {
    if (error instanceof ConfigurationError) throw error
    throw new ConfigurationError({
      code: ErrorCodes.config.missingEnvVar(),
      message: `Supabase server client initialization failed: ${error instanceof Error ? error.message : String(error)}`,
      context: {
        originalError: error instanceof Error ? error.message : String(error),
      },
      statusCode: 500,
      cause: error instanceof Error ? error : undefined,
    })
  }
}

/**
 * Create a Supabase admin client with service role privileges.
 * Bypasses Row Level Security (RLS) and session management.
 *
 * @returns Supabase client with admin/service role privileges
 *
 * @remarks
 * **Security Warning**: This client bypasses all RLS policies.
 * - Use only in secure server contexts (Server Actions, API routes)
 * - Never expose to client-side code
 * - Prefer regular server client when possible
 *
 * **Use Cases**:
 * - Administrative operations
 * - System-level data access
 * - Bypassing RLS for trusted operations
 * - Background jobs and cron tasks
 *
 * @example
 * ```typescript
 * // In a Server Action
 * 'use server'
 *
 * export async function adminOperation() {
 *   const adminClient = await createAdminClient()
 *   // This bypasses RLS policies
 *   const { data } = await adminClient.from('profiles').select('*')
 *   return data
 * }
 * ```
 */
export const createAdminClient = async (): Promise<SupabaseClient<Database>> => {
  const config = getSupabaseConfig()
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) {
    throw new ConfigurationError({
      code: ErrorCodes.config.missingEnvVar(),
      message: 'Missing required environment variable: SUPABASE_SECRET_KEY',
      statusCode: 500,
    })
  }
  return createSupabaseClient(config.url, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
