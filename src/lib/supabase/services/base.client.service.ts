/**
 * Base Client Service
 *
 * Client-side base service implementation.
 * Extends BaseService with client-specific error handling.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { handleClientError } from '@/lib/error'
import type { Database } from '@/types/supabase'
import type { Logger } from '@/types/logger.types'
import { BaseService } from './base.service'

/**
 * Client-side base service class.
 * Thin wrapper around BaseService that provides client-specific error handling.
 *
 * @remarks
 * This class should be extended by all client-side services.
 * It automatically handles errors using the client error handler,
 * which is optimized for browser environments.
 *
 * @example
 * ```typescript
 * import { BaseClientService } from '@/lib/supabase/services/base.client.service'
 * import { createClient } from '@/lib/supabase/client'
 * import { buildIsomorphicLogger } from '@/lib/logger/isomorphic'
 *
 * class MyClientService extends BaseClientService {
 *   async fetchData() {
 *     const { data, error } = await this.client.from('table').select('*')
 *     if (error) this.handleError(error, 'fetch data')
 *     return data
 *   }
 * }
 *
 * // Usage
 * const client = createClient()
 * const logger = buildIsomorphicLogger('my-service')
 * const service = new MyClientService(client, logger)
 * ```
 */
export abstract class BaseClientService extends BaseService {
  /**
   * Create a new BaseClientService instance
   * @param client - Required Supabase client (explicit injection)
   * @param logger - Required logger instance (explicit injection)
   */
  constructor(client: SupabaseClient<Database>, logger: Logger) {
    super(client, logger, handleClientError)
  }
}
