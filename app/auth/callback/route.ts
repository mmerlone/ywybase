import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ROUTES } from '@/config/routes'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('auth-oauth-callback')

/**
 * OAuth Callback Handler
 *
 * Handles the callback from OAuth providers (Google, GitHub, etc.)
 * Exchanges the code for a session and redirects the user.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // allow "next" to be passed as a query param, defaulting to profile
  const defaultRedirect = ROUTES.AUTH.redirectIfAuthenticated ?? undefined
  const nextParam = searchParams.get('next')
  // Validate next is a relative path starting with / and not a protocol-relative URL
  const next =
    nextParam !== null && nextParam !== undefined && nextParam.startsWith('/') && !nextParam.startsWith('//')
      ? nextParam
      : defaultRedirect

  if (code !== null && code !== undefined) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      logger.info({ code: code ? '[REDACTED]' : null, redirect: next }, 'OAuth exchange succeeded')
      return NextResponse.redirect(`${origin}${next}`)
    }

    logger.error(
      {
        code: code ? '[REDACTED]' : null,
        next,
        error: error.message,
        status: error.status,
      },
      'OAuth exchange failed'
    )
  } else {
    logger.warn({ reason: 'missing_code', next }, 'OAuth callback called without code')
  }

  // Return the user to an error page with instructions if code is missing or invalid
  return NextResponse.redirect(`${origin}/error?code=auth_code_invalid`)
}
