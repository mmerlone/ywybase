/**
 * Database Types
 *
 * Type definitions for database entities, queries, and operations.
 * Provides type-safe wrappers around Supabase generated types with application-specific extensions.
 */

import { type PostgrestError } from '@supabase/supabase-js'

import { type Database } from './supabase'
import type { ProfileAutoSync } from './profile.types'

/**
 * Raw database profile row type from Supabase.
 * Represents the complete profile table row as stored in the database.
 */
export type DbProfile = Database['public']['Tables']['profiles']['Row']

/**
 * Type for inserting new profiles into the database.
 * Excludes auto-generated and auth-synced fields.
 */
export type DbProfileInsert = Omit<Database['public']['Tables']['profiles']['Insert'], ProfileAutoSync>

/**
 * Type for updating existing profiles in the database.
 * Excludes immutable and auth-synced fields.
 */
export type DbProfileUpdate = Omit<Database['public']['Tables']['profiles']['Update'], ProfileAutoSync>

/**
 * Re-export of the Supabase generated database type.
 * Provides access to all table schemas and their types.
 */
export type { Database }

/**
 * Sort direction options (shared across all queries)
 */
export const SortOrderEnum = {
  ASC: 'asc',
  DESC: 'desc',
} as const
export type SortOrder = (typeof SortOrderEnum)[keyof typeof SortOrderEnum]

/**
 * Extracts the resolved type from a Promise.
 * Useful for typing the result of async database operations.
 *
 * @template T - The Promise type to extract from
 */
export type DbResult<T> = T extends PromiseLike<infer U> ? U : never

/**
 * Extracts the data type from a Supabase query Promise, excluding null.
 * Provides type safety for successful database query results.
 *
 * @template T - The Promise type containing { data: ... }
 */
export type DbResultOk<T> = T extends PromiseLike<{ data: infer U }> ? Exclude<U, null> : never

/**
 * Type for database error responses from Postgrest.
 * Used for handling database operation failures.
 */
export type DbResultErr = PostgrestError

/**
 * Generic type for paginated database query results.
 * Provides metadata about pagination alongside the data.
 *
 * @template T - The type of items in the result set
 *
 * @example
 * ```typescript
 * const result: PaginatedResult<Profile> = {
 *   data: [profile1, profile2],
 *   count: 100,
 *   page: 1,
 *   pageSize: 20,
 *   pageCount: 5
 * };
 * ```
 */
export interface PaginatedResult<T> {
  /** Array of items for the current page */
  data: T[]
  /** Total number of items across all pages (null if count not requested) */
  count: number
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
  /** Total number of pages */
  pageCount: number
}

/**
 * Database filter operators for query building.
 * Supports common comparison and pattern matching operations.
 *
 * @remarks
 * - `eq`: Equal to
 * - `neq`: Not equal to
 * - `gt`: Greater than
 * - `gte`: Greater than or equal to
 * - `lt`: Less than
 * - `lte`: Less than or equal to
 * - `like`: SQL LIKE pattern matching (case-sensitive)
 * - `ilike`: SQL ILIKE pattern matching (case-insensitive)
 * - `in`: Value in array
 * - `contains`: Array/range contains value
 * - `containedBy`: Array/range contained by value
 * - `overlap`: Arrays/ranges have common elements
 */
export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'in'
  | 'contains'
  | 'containedBy'
  | 'overlap'

/**
 * Type-safe filter configuration for database queries.
 *
 * @template T - The entity type being filtered
 *
 * @example
 * ```typescript
 * const filter: Filter<Profile> = {
 *   column: 'email',
 *   operator: 'ilike',
 *   value: '%@example.com'
 * };
 * ```
 */
export type Filter<T> = {
  /** Column name to filter on (type-safe based on entity) */
  column: keyof T
  /** Comparison or pattern matching operator */
  operator: FilterOperator
  /** Value to compare against */
  value: unknown
}

/**
 * Configuration for result ordering in database queries.
 *
 * @template T - The entity type being ordered
 *
 * @example
 * ```typescript
 * const orderBy: OrderBy<Profile> = {
 *   column: 'created_at',
 *   ascending: false,
 *   nullsFirst: false
 * };
 * ```
 */
export type OrderBy<T> = {
  /** Column to sort by (type-safe based on entity) */
  column: keyof T
  /** Sort in ascending order (true) or descending (false). Default: true */
  ascending?: boolean
  /** Whether null values should appear first. Default: false */
  nullsFirst?: boolean
}

/**
 * Comprehensive query configuration for database operations.
 * Supports filtering, ordering, pagination, and field selection.
 *
 * @template T - The entity type being queried
 *
 * @example
 * ```typescript
 * const options: QueryOptions<Profile> = {
 *   select: 'id, email, full_name',
 *   filters: [{ column: 'is_active', operator: 'eq', value: true }],
 *   orderBy: { column: 'created_at', ascending: false },
 *   page: 1,
 *   pageSize: 20
 * };
 * ```
 */
export type QueryOptions<T> = {
  /** Comma-separated list of columns to select (Postgrest format) */
  select?: string
  /** Array of filters to apply to the query */
  filters?: Filter<T>[]
  /** Ordering configuration for results */
  orderBy?: OrderBy<T>
  /** Maximum number of results to return */
  limit?: number
  /** Number of results to skip (for pagination) */
  offset?: number
  /** Page number (1-indexed, alternative to offset) */
  page?: number
  /** Number of items per page (used with page parameter) */
  pageSize?: number
}
