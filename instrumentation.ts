import * as Sentry from '@sentry/nextjs'

export async function register(): Promise<void> {
  // Validate Supabase configuration at startup (fail-fast)
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Only validate on server-side to avoid build issues
    const { validateSupabaseConfigAtStartup } = await import('@/config/supabase')
    validateSupabaseConfigAtStartup()

    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
