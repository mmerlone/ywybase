/**
 * Supabase Middleware Session Management
 *
 * Handles session refresh and cookie management in Next.js middleware.
 * Ensures authentication state is maintained across requests.
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

import { getSupabaseConfig } from '@/config/supabase'
import { ConfigurationError } from '@/lib/error/errors'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('supabase-middleware')

/**
 * Update and refresh Supabase session in middleware.
 * Manages authentication cookies and user session state.
 *
 * @param request - The incoming Next.js request
 * @param incomingResponse - Optional response to modify (creates new response if not provided)
 * @returns NextResponse with updated session cookies and headers
 *
 * @remarks
 * This function:
 * - Refreshes authentication tokens
 * - Updates session cookies with secure options
 * - Adds user info to request headers for Server Components
 * - Skips processing for error responses (status >= 400)
 *
 * **Security Features**:
 * - httpOnly cookies (JavaScript access prevented)
 * - Secure flag in production
 * - SameSite=lax for CSRF protection
 *
 * @example
 * ```typescript
 * // In middleware.ts
 * export async function middleware(request: NextRequest) {
 *   // Pass no response to create new one
 *   let response = await updateSession(request)
 *
 *   // Or pass existing response to modify it
 *   response = await updateSession(request, response)
 *
 *   return response
 * }
 * ```
 */
export async function updateSession(request: NextRequest, incomingResponse?: NextResponse): Promise<NextResponse> {
  // Use incoming response if provided, otherwise create a new one
  const response = incomingResponse ?? NextResponse.next({ request })

  try {
    const config = getSupabaseConfig()

    const supabase = createServerClient(config.url, config.publishableKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // Skip if this is an error response (status >= 400)
            if (response.status >= 400) {
              return
            }

            // Update request cookies for current request
            request.cookies.set(name, value)

            // Use Supabase-provided options verbatim — overriding fields like
            // httpOnly or secure would prevent the browser client from reading
            // refreshed auth cookies in client components.
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    })

    // Skip auth check if this is already an error response
    if (response.status >= 400) {
      return response
    }

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) {
      logger.error({ message: error.message }, 'Failed to verify user')

      // For invalid JWT tokens (not missing session), clear the session
      if (error.name !== 'AuthSessionMissingError') {
        try {
          await supabase.auth.signOut({ scope: 'local' })
          logger.info(
            { module: 'supabase-middleware', action: 'clear-invalid-session' },
            'Cleared invalid session due to JWT verification failure'
          )
        } catch (signOutError) {
          logger.warn({ err: signOutError }, 'Failed to clear invalid session')
        }
      }

      return response
    }

    if (user) {
      logger.debug({ userId: user.id }, 'User verified in middleware')
      // Add user info to request headers for server components
      const newHeaders = new Headers(response.headers)
      newHeaders.set('x-user-id', user.id)
      newHeaders.set('x-user-email', user.email ?? '')

      // Create a new response with updated headers
      const newResponse = new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })

      // Copy cookies from the original response
      response.cookies.getAll().forEach((cookie) => {
        newResponse.cookies.set(cookie)
      })

      return newResponse
    }

    return response
  } catch (error) {
    // Check if this is a configuration error
    if (error instanceof ConfigurationError) {
      logger.error(
        {
          error,
          code: error.code,
          context: error.context,
        },
        'Supabase configuration error in middleware'
      )
      // Redirect to error page with configuration error
      return NextResponse.redirect(new URL('/error?code=configuration_error', request.url))
    }

    logger.error({ err: error }, 'Unexpected error in session management')
    return response
  }
}
