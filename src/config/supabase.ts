import { logger } from '@/lib/logger/server'

export interface SupabaseConfig {
  url: string
  publishableKey: string
}

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  config?: SupabaseConfig
}

/**
 * Validates Supabase configuration using new publishable key format only
 *
 * Required environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL: Your Supabase project URL
 * - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: Your publishable API key (sb_publishable_...)
 */
export function validateSupabaseConfig(): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  // Validate URL
  if (!url) {
    errors.push('Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL')
  } else if (!url.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS')
  } else if (!url.includes('.supabase.co')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_URL should be a valid Supabase URL (*.supabase.co)')
  }

  // Validate publishable key
  if (!publishableKey) {
    errors.push('Missing required environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
  } else if (!publishableKey.startsWith('sb_publishable_')) {
    warnings.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY should start with "sb_publishable_"')
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings }
  }

  return {
    isValid: true,
    errors: [],
    warnings,
    config: { url: url!, publishableKey: publishableKey! },
  }
}

/**
 * Gets validated Supabase configuration or throws error
 * Use this in client creation functions
 */
export function getSupabaseConfig(): SupabaseConfig {
  const validation = validateSupabaseConfig()

  // Log warnings if present (use warn level for configuration issues)
  if (validation.warnings.length > 0) {
    validation.warnings.forEach((warning) => {
      logger.warn({ warning }, 'Supabase configuration warning')
    })
  }

  if (!validation.isValid) {
    const errorMessage = `Invalid Supabase configuration:\n${validation.errors.join('\n')}`
    logger.error({ errors: validation.errors }, 'Supabase configuration validation failed')
    throw new Error(errorMessage)
  }

  return validation.config!
}

/**
 * Validates configuration at startup
 * Call this from instrumentation.ts register() function
 */
export function validateSupabaseConfigAtStartup(): void {
  const validation = validateSupabaseConfig()

  if (!validation.isValid) {
    const errorMessage = [
      '❌ FATAL: Invalid Supabase Configuration',
      '',
      'The application cannot start due to missing or invalid Supabase configuration.',
      '',
      'Errors:',
      ...validation.errors.map((e) => `  • ${e}`),
      '',
      'Required environment variables:',
      '  • NEXT_PUBLIC_SUPABASE_URL - Your Supabase project URL',
      '  • NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY - Your publishable API key (sb_publishable_...)',
      '',
      'Setup instructions:',
      '  1. Copy .env.sample to .env.local',
      '  2. Get your credentials from: https://supabase.com/dashboard/project/_/settings/api',
      '  3. Update the values in .env.local',
      '  4. Restart the development server',
      '',
      'Example .env.local:',
      '  NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co',
      '  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxxxx',
      '',
    ].join('\n')

    // Use logger.error for structured logging
    logger.error(
      {
        errors: validation.errors,
        severity: 'FATAL',
        component: 'startup-validation',
      },
      errorMessage
    )

    // Do NOT throw error to prevent application startup
    // Always log the error, but allow the app to start so UX fallback can be shown
    // This enables graceful degradation and never 500s due to missing Supabase config
    // (If you want to enforce fail-fast in CI, do so in a separate script)
  } else if (validation.warnings.length > 0) {
    logger.warn(
      {
        warnings: validation.warnings,
        component: 'startup-validation',
      },
      'Supabase Configuration Warnings'
    )
  } else {
    logger.info({ component: 'startup-validation' }, 'Supabase configuration validated successfully')
  }
}
