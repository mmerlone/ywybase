export type SupabaseEnvStatus = {
  isConfigured: boolean
  missing: string[]
}

/**
 * Only check NEXT_PUBLIC_* variables that are available on both server and client.
 * Server-only variables (SUPABASE_PROJECT_ID, SUPABASE_SECRET_KEY, SUPABASE_DB_PASSWORD)
 * are not included to avoid hydration mismatches.
 */
const REQUIRED_SUPABASE_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY'] as const

/**
 * Lightweight Supabase environment check safe for both server and client usage.
 * Only checks public environment variables to avoid hydration mismatches.
 *
 * @remarks
 * Server-only variables (PROJECT_ID, SECRET_KEY, DB_PASSWORD) are validated
 * separately where needed (e.g., in scripts or admin operations).
 */
export function getSupabaseEnvStatus(): SupabaseEnvStatus {
  const missing: string[] = []

  for (const key of REQUIRED_SUPABASE_KEYS) {
    if (!process.env[key]) {
      missing.push(key)
    }
  }

  return {
    isConfigured: missing.length === 0,
    missing,
  }
}

/**
 * Returns true when the minimum Supabase env vars are present.
 */
export function isSupabaseConfigured(): boolean {
  return getSupabaseEnvStatus().isConfigured
}
