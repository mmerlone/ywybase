import { createAdminClient } from '@/lib/supabase/server'
import { logger } from '@/lib/logger/server'

/**
 * Audit utilities for administrative authentication operations.
 *
 * @module auth/admin
 */

/**
 * Result of a user existence check for auditing purposes.
 */
export interface UserAuditResult {
  id?: string
  email: string
  found: boolean
}

/**
 * Efficiently checks if a user exists by email for internal auditing.
 * Uses the profiles table as a proxy to avoid expensive auth.admin.listUsers() calls.
 *
 * @param email - The email address to check
 * @returns Object containing existence status and userId if found
 *
 * @remarks
 * **Security**: This is for internal auditing ONLY. Do not return existence status to the client.
 * **Performance**: Queries the indexed profiles table.
 */
export async function findUserByEmail(email: string): Promise<UserAuditResult> {
  try {
    const adminClient = await createAdminClient()

    // Efficiently check existence via the profiles table which tracks auth users
    const { data, error } = await adminClient.from('profiles').select('id, email').eq('email', email).maybeSingle()

    if (error) {
      logger.error({ email, error }, 'Failed to check user existence in profiles table')
      return { email, found: false }
    }

    if (data) {
      return {
        id: data.id,
        email: data.email,
        found: true,
      }
    }

    return { email, found: false }
  } catch (err) {
    logger.error({ email, err }, 'Unexpected error during user existence audit check')
    return { email, found: false }
  }
}
