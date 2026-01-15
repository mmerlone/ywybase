/**
 * Lightweight Sentry environment check safe for both server and client usage.
 * Only checks public environment variables to avoid hydration mismatches.
 * Server-only variables (SENTRY_AUTH_TOKEN) are validated separately where needed.
 */
/**
 * Sentry environment status type
 */
export interface SentryEnvStatus {
  isConfigured: boolean
  isValid: boolean
  missing: string[]
}

export function getSentryEnvStatus(): SentryEnvStatus {
  const REQUIRED_SENTRY_KEYS = ['NEXT_PUBLIC_SENTRY_DSN']
  const missing = REQUIRED_SENTRY_KEYS.filter((key) => !process.env[key])
  return {
    isConfigured: missing.length === 0,
    isValid: missing.length === 0,
    missing,
  }
}
