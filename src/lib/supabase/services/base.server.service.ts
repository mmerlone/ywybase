/**
 * Base Server Service
 *
 * Server-side base service implementation.
 * Extends BaseService with server-specific error handling.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { handleServerError } from '@/lib/error/server'
import type { Database } from '@/types/supabase'
import type { Logger } from '@/types/logger.types'
import { BaseService } from './base.service'

/**
 * Server-side base service class.
 * Thin wrapper around BaseService that provides server-specific error handling.
 *
 * @remarks
 * This class should be extended by all server-side services.
 * It automatically handles errors using the server error handler,
 * which is optimized for Node.js/server environments.
 *
 * @example
 * ```typescript
 * 'use server'
 *
 * import { BaseServerService } from '@/lib/supabase/services/base.server.service'
 * import { createClient } from '@/lib/supabase/server'
 * import { logger } from '@/lib/logger/server'
 *
 * class MyServerService extends BaseServerService {
 *   async fetchData() {
 *     const { data, error } = await this.client.from('table').select('*')
 *     if (error) this.handleError(error, 'fetch data')
 *     return data
 *   }
 * }
 *
 * // Usage in Server Action
 * export async function getData() {
 *   const client = await createClient()
 *   const service = new MyServerService(client, logger)
 *   return await service.fetchData()
 * }
 * ```
 */
export abstract class BaseServerService extends BaseService {
  /**
   * Create a new BaseServerService instance
   * @param client - Required Supabase client (explicit injection)
   * @param logger - Required logger instance (explicit injection)
   */
  constructor(client: SupabaseClient<Database>, logger: Logger) {
    super(client, logger, handleServerError)
  }
}
