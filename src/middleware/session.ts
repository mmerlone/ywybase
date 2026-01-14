import { NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { createClient } from '@/lib/supabase/server'
import { MiddlewareSession } from './utils/types'

const logger = buildLogger('session-middleware')

/**
 * Get the current session from the request
 * @param request Optional NextRequest object (required in middleware)
 * @returns MiddlewareSession or null if no valid session
 */
export async function getSession(request?: NextRequest): Promise<MiddlewareSession | null> {
  try {
    const supabase = request ? await createClient(request) : await createClient()

    // Use getUser() for secure authentication validation
    // Note: getUser() contacts the Supabase Auth server to validate the token,
    // whereas getSession() reads from storage (cookies) without server verification
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      if (userError) {
        logger.warn({ err: userError }, 'Failed to get authenticated user')
      }
      return null
    }

    // Get session for additional metadata (expires_at)
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) return null

    let expires_at = session.expires_at
    if (!expires_at) {
      logger.warn({ userId: user.id }, 'Session missing expires_at. Using 1hr fallback.')
      expires_at = Math.floor((Date.now() + 3600000) / 1000)
    }

    return {
      id: user.id,
      expires_at,
      user,
      issued_at: user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : undefined,
    }
  } catch (err) {
    logger.error({ err }, 'Failed to get session')
    return null
  }
}

/**
 * Updates the session by calling the Supabase middleware updateSession function
 * @param request The NextRequest object
 * @param response The NextResponse object to update with session cookies
 * @returns Promise<NextResponse> with updated session cookies
 */
export async function updateSession(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const { updateSession: supabaseUpdateSession } = await import('@/lib/supabase/middleware')
  return await supabaseUpdateSession(request, response)
}
