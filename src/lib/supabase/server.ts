'use server'

import { createServerClient } from '@supabase/ssr'
import { type SupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'

import { getSupabaseConfig } from '@/config/supabase'
import { ConfigurationError } from '@/lib/error/errors'
import { ErrorCodes } from '@/lib/error/codes'
import { logger } from '@/lib/logger/server'
import type { Database } from '@/types/supabase'

/**
 * Creates a Supabase client for server-side usage
 *
 * @param request Optional NextRequest object for middleware context
 * @returns Configured Supabase client
 *
 * @example
 * // In middleware (with request context)
 * const supabase = await createClient(request)
 *
 * @example
 * // In server components/actions (no request context)
 * const supabase = await createClient()
 *
 * @throws {ConfigurationError} If Supabase configuration is invalid
 */
export const createClient = async (request?: NextRequest): Promise<SupabaseClient<Database>> => {
  try {
    const config = getSupabaseConfig()

    // Handle middleware context (with NextRequest)
    if (request) {
      return createServerClient<Database>(config.url, config.publishableKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
            })
          },
        },
      })
    }

    // Handle server components/actions context (existing implementation)
    const cookieStore = await cookies()
    return createServerClient<Database>(config.url, config.publishableKey, {
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
            logger.warn({ err }, 'Supabase cookie set failed (ignorable in Server Components)')
          }
        },
      },
    })
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
  return await createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}
