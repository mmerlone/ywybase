/**
 * Base Service Interface Definitions
 *
 * Defines the common interface for all Supabase service classes.
 * Ensures consistent API across client and server environments.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import type { LogLevel, LoggerContext, Logger } from '@/types/logger.types'
import type { ErrorHandler } from './base.service'

/**
 * Common interface for all base services (client and server).
 * Ensures consistent API across different environments.
 *
 * @remarks
 * All service classes should implement this interface to guarantee
 * compatible error handling, logging, and utility methods.
 */
export interface IBaseService {
  /**
   * Handle errors consistently across all services
   * @param error - The error that occurred
   * @param operation - Description of the operation that failed
   * @param context - Additional context data
   * @returns Never returns, always throws an error
   * @throws {AppError} Always throws an AppError instance
   */
  handleError(error: unknown, operation: string, context?: LoggerContext): never

  /**
   * Helper to safely access nested properties
   * @param value - The value to check
   * @param defaultValue - Default value if value is null or undefined
   * @returns The value or default value
   */
  safeGet<T>(value: T | null | undefined, defaultValue: T): T

  /**
   * Unified logging method across client and server services
   * @param level - Log level from LogLevelEnum
   * @param message - Log message
   * @param context - Additional context
   */
  log(level: LogLevel, message: string, context?: LoggerContext): void
}

/**
 * Base service constructor interface.
 * Defines the structure for service class constructors.
 *
 * @remarks
 * Services should implement this interface to ensure proper
 * dependency injection of client, logger, and error handler.
 */
export interface IBaseServiceConstructor {
  /** Create new service instance with required dependencies */
  new (client: SupabaseClient<Database>, logger: Logger, errorHandler: ErrorHandler): IBaseService
  /** Clean up service resources */
  cleanup(): Promise<void>
}
