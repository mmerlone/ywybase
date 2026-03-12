import * as Sentry from '@sentry/nextjs'

export async function register(): Promise<void> {
  // Validate Supabase configuration at startup (fail-fast)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only validate on server-side to avoid build issues
    const { validateSupabaseConfigAtStartup } = await import('@/config/supabase')
    const { validateRateLimitConfig } = await import('@/middleware/security/rate-limit')
    const { buildLogger } = await import('@/lib/logger/server')
    const logger = buildLogger('startup-rate-limit')

    validateSupabaseConfigAtStartup()

    const rateLimitValidation = validateRateLimitConfig()
    if (!rateLimitValidation.isValid) {
      logger.warn({ issues: rateLimitValidation.issues }, 'Rate limit configuration issues detected')
    } else {
      logger.info({}, 'Rate limit configuration validated successfully')
    }

    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
