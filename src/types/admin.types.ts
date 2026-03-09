/**
 * Admin Dashboard Types
 *
 * Type definitions for admin dashboard functionality including
 * user management, pagination, and dashboard statistics.
 */

import type { Profile, UserStatusFilter } from './profile.types'
import { type PaginatedResult, type SortOrder } from './database'

// TODO: does that makes sense?
// export const DEFAULT_DEV_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : undefined

/** Paginated result of profiles with synced auth metadata */
export type PaginatedProfilesResult = PaginatedResult<Profile>

/**
 * Database user role enumeration.
 * Matches the `public.user_role` enum in the database schema.
 * These are the only roles that can be stored in the profiles table.
 *
 * @remarks
 * Database schema: `CREATE TYPE public.user_role AS ENUM ('user', 'moderator', 'admin', 'root')`
 */
export const DbUserRoleEnum = {
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  ROOT: 'root',
} as const

/**
 * Database user role type.
 * String literal type derived from DbUserRoleEnum.
 */
export type DbUserRole = (typeof DbUserRoleEnum)[keyof typeof DbUserRoleEnum]

/**
 * Application user role enumeration.
 * Extends database roles with GUEST for unauthenticated users.
 *
 * @remarks
 * - GUEST: Internal application role for unauthenticated users (not stored in database)
 * - USER, MODERATOR, ADMIN, ROOT: Database roles synced with profiles table
 *
 * @example
 * ```typescript
 * // Unauthenticated user
 * const guestRole: UserRole = UserRoleEnum.GUEST;
 *
 * // Authenticated user from database
 * const dbRole: UserRole = profile.role; // 'user' | 'moderator' | 'admin' | 'root'
 * ```
 */
export const UserRoleEnum = {
  /** Application-only role for unauthenticated users (not in database) */
  GUEST: 'guest',
  /** Standard authenticated user */
  USER: 'user',
  /** Moderator with elevated permissions */
  MODERATOR: 'moderator',
  /** Administrator with full permissions */
  ADMIN: 'admin',
  /** Root user with system-level access */
  ROOT: 'root',
} as const

/**
 * Application user role type.
 * String literal type derived from UserRoleEnum.
 */
export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum]

/**
 * User role filter options (including ALL)
 */
export const UserRoleFilterEnum = {
  ALL: 'all',
  GUEST: 'guest',
  USER: 'user',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  ROOT: 'root',
} as const
export type UserRoleFilter = (typeof UserRoleFilterEnum)[keyof typeof UserRoleFilterEnum]

/**
 * Sort options for profile queries.
 * All fields are now available directly in the profiles table.
 */
export const ProfileSortByEnum = {
  DISPLAY_NAME: 'display_name',
  EMAIL: 'email',
  /** Sort by last sign-in time (synced from auth.users) */
  LAST_SIGN_IN_AT: 'last_sign_in_at',
  /** Sort by account creation time (synced from auth.users) */
  CREATED_AT: 'created_at',
  /** Sort by email confirmation time (synced from auth.users) */
  CONFIRMED_AT: 'confirmed_at',
  UPDATED_AT: 'updated_at',
} as const
export type ProfileSortBy = (typeof ProfileSortByEnum)[keyof typeof ProfileSortByEnum]

/**
 * Query options for fetching profiles in admin dashboard
 */
export interface ProfilesQueryOptions {
  /** Page number (1-indexed) */
  page?: number
  /** Number of profiles per page */
  pageSize?: number
  /** Filter by profile status */
  status?: UserStatusFilter
  /** Filter by user role */
  role?: UserRoleFilter
  /** Search term for email or display name */
  search?: string

  /** Sort field */
  sortBy?: ProfileSortBy
  /** Sort direction */
  sortOrder?: SortOrder
}

/**
 * Dashboard overview statistics
 */
export interface DashboardStats {
  /** Total number of registered users */
  totalUsers: number
  /** Number of active users (logged in within last 30 days) */
  activeUsers: number
  /** Number of users who signed up in the last 7 days */
  recentSignups: number
  /** Number of users with pending status */
  pendingUsers: number
}
