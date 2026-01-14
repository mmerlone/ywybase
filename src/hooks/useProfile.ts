'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useRef, useEffect } from 'react'

import { QUERY_CONFIG, QUERY_KEYS } from '@/config/query'
import { ErrorCodes } from '@/lib/error/codes'
import { BusinessError } from '@/lib/error/errors'
import { logger } from '@/lib/logger/client'
import {
  getProfile,
  updateProfile as updateProfileAction,
  uploadAvatar as uploadAvatarAction,
} from '@/lib/actions/profile'
import type { Profile } from '@/types/database'
import { ThemePreference } from '@/types/theme.types'

/**
 * User profile management hook with React Query integration.
 *
 * This hook provides comprehensive profile data management including fetching, updating,
 * theme preferences, and avatar uploads. It uses React Query for caching, deduplication,
 * optimistic updates, and proper error handling with the centralized error system.
 *
 * @param {string} [userId] - The user ID to fetch profile for. If undefined, the query is disabled
 * @param {Profile | null} [initialData] - Optional initial data for hydration (e.g. from Server Components)
 * @returns {UseProfileReturn} Object containing:
 * - `profile`: User profile data or null
 * - `isLoading`: Loading state for fetch operations
 * - `isUpdating`: Loading state for update operations
 * - `isUploadingAvatar`: Loading state for avatar uploads
 * - `error`: Any error that occurred or null
 * - `updateProfile`: Function to update profile fields with optimistic updates
 * - `updateThemePreference`: Function to update theme preference
 * - `uploadAvatar`: Function to upload avatar image
 * - `refetch`: Function to manually refetch profile data
 *
 * @example
 * ```tsx
 * function UserProfile() {
 *   const { profile, isLoading, error, updateProfile } = useProfile('user-123');
 *
 *   if (isLoading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error.message}</div>;
 *
 *   const handleUpdate = async (updates) => {
 *     try {
 *       await updateProfile(updates);
 *       // Handle success (e.g., show toast notification)
 *     } catch (err) {
 *       // Handle error (e.g., show error message)
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <h1>{profile?.display_name}</h1>
 *       <button onClick={() => handleUpdate({ bio: 'New bio' })}>
 *         Update Bio
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function ThemeToggle() {
 *   const { profile, updateThemePreference } = useProfile('user-123');
 *
 *   const toggleTheme = () => {
 *     const newTheme = profile?.theme === 'dark' ? 'light' : 'dark';
 *     updateThemePreference(newTheme);
 *   };
 *
 *   return (
 *     <button onClick={toggleTheme}>
 *       Current theme: {profile?.theme}
 *     </button>
 *   );
 * }
 * ```
 */
export function useProfile(
  userId?: string,
  initialData?: Profile | null
): {
  profile: Profile | null
  isLoading: boolean
  isUpdating: boolean
  isUploadingAvatar: boolean
  error: Error | null
  updateProfile: (updates: Partial<Profile>) => Promise<Profile>
  updateThemePreference: (theme: ThemePreference) => Promise<void>
  uploadAvatar: (file: File) => Promise<string>
  refetch: () => void
} {
  const queryClient = useQueryClient()
  const abortControllerRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      // Abort any pending requests when component unmounts
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery<Profile | null>({
    queryKey: QUERY_KEYS.profile(userId),
    initialData: initialData || undefined,
    queryFn: async () => {
      if (userId === null || userId === undefined) return null
      try {
        const result = await getProfile(userId)
        if (!result.success) {
          throw new Error(typeof result.error === 'string' ? result.error : 'Failed to load profile')
        }
        return result.data ?? null
      } catch (error) {
        const errorContext = {
          userId,
          operation: 'loadProfile',
          ...(error instanceof Error ? { stack: error.stack } : {}),
        }

        logger.error(
          {
            error,
            ...errorContext,
          },
          'Failed to load profile'
        )

        throw error
      }
    },
    enabled: userId !== null && userId !== undefined,
    staleTime: QUERY_CONFIG.profile.staleTime,
    gcTime: QUERY_CONFIG.profile.gcTime,
    refetchOnWindowFocus: false, // Prevent refetch on window focus to avoid unnecessary reloads
    refetchOnMount: false, // Only refetch if data is stale
    retry: (failureCount, error) => {
      if (
        error instanceof BusinessError &&
        error.statusCode !== null &&
        error.statusCode !== undefined &&
        QUERY_CONFIG.retry.nonRetryableStatusCodes.includes(error.statusCode as 400 | 401 | 403 | 404)
      ) {
        return false
      }
      return failureCount < QUERY_CONFIG.retry.maxAttempts
    },
  })

  type MutationContext = { previousProfile: Profile | null | undefined } | undefined

  const { mutateAsync: updateProfile, isPending: isUpdating } = useMutation<
    Profile,
    Error,
    Partial<Profile>,
    MutationContext
  >({
    mutationKey: [...QUERY_KEYS.profile(userId), 'update'],
    mutationFn: async (updates: Partial<Profile>) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required',
          statusCode: 400,
          context: { operation: 'updateProfile' },
        })
      }

      // Cancel previous request if exists
      abortControllerRef.current?.abort()
      abortControllerRef.current = new AbortController()

      try {
        const result = await updateProfileAction(userId, updates)
        if (!result.success || !result.data) {
          throw new Error(typeof result.error === 'string' ? result.error : 'Failed to update profile')
        }
        return result.data
      } catch (error) {
        // Don't throw if aborted - this is expected behavior
        if (error instanceof Error && error.name === 'AbortError') {
          logger.debug({ userId, operation: 'updateProfile' }, 'Profile update aborted')
          throw error
        }
        throw error
      }
    },
    onMutate: async (updates) => {
      if (userId === null || userId === undefined) return

      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.profile(userId) })

      const previousProfile = queryClient.getQueryData<Profile | null>(QUERY_KEYS.profile(userId))

      if (previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.profile(userId), {
          ...previousProfile,
          ...updates,
        })
      }

      return { previousProfile }
    },
    onError: (error, _, context) => {
      const errorContext = {
        userId,
        operation: 'updateProfile',
        ...(error instanceof BusinessError
          ? {
              code: error.code,
              statusCode: error.statusCode,
              isOperational: error.isOperational,
            }
          : {}),
      }

      logger.error(
        {
          error,
          ...errorContext,
        },
        'Profile update failed'
      )

      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.profile(userId), context.previousProfile)
      }
    },
    onSettled: () => {
      // Clear abort controller reference
      abortControllerRef.current = null

      // Invalidate queries to trigger refetch, but use refetchType: 'active' to only refetch active queries
      // This prevents unnecessary refetches that could cause component remounts
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(userId),
        refetchType: 'active', // Only refetch if the query is currently being used
      })
    },
  })

  const { mutateAsync: uploadAvatar, isPending: isUploadingAvatar } = useMutation<string, Error, File, undefined>({
    mutationKey: [...QUERY_KEYS.profile(userId), 'avatar'],
    mutationFn: async (file: File) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required for avatar upload',
          statusCode: 400,
          context: { operation: 'uploadAvatar' },
        })
      }

      // Create new AbortController for this operation
      abortControllerRef.current = new AbortController()

      try {
        const result = await uploadAvatarAction(userId, file)
        if (!result.success || !result.data) {
          throw new Error(typeof result.error === 'string' ? result.error : 'Failed to upload avatar')
        }
        return result.data
      } finally {
        // Clear the abort controller after operation completes
        abortControllerRef.current = null
      }
    },
    onSuccess: (avatarUrl) => {
      queryClient.setQueryData(QUERY_KEYS.profile(userId), (old: Profile | null) => {
        if (!old) return old
        // Use Object.assign for single property update (more efficient than spread)
        return Object.assign({}, old, { avatar_url: avatarUrl })
      })
    },
    onError: (error) => {
      logger.error(
        {
          error,
          userId,
          operation: 'uploadAvatar',
        },
        'Avatar upload failed'
      )
    },
    onSettled: () => {
      // Invalidate queries to trigger refetch, but use refetchType: 'active' to only refetch active queries
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.profile(userId),
        refetchType: 'active',
      })
    },
  })

  const updateThemePreference = useCallback(
    async (theme: ThemePreference) => {
      if (userId === null || userId === undefined) {
        throw new BusinessError({
          code: ErrorCodes.validation.invalidInput(),
          message: 'User ID is required to update theme preference',
          statusCode: 400,
          context: { operation: 'updateThemePreference' },
        })
      }

      try {
        await updateProfile({ theme })
      } catch (err: unknown) {
        const errorObj = err instanceof Error ? err : new Error(String(err))
        logger.error({ err: errorObj, userId, theme }, 'Failed to update theme preference')
        throw errorObj
      }
    },
    [userId, updateProfile]
  )

  return {
    /** The user's profile data, or null if not loaded/found */
    profile: profile || null,
    /** True if the initial profile load is in progress (not background refetching) */
    isLoading: isLoading,
    /** True if a profile update mutation is in progress */
    isUpdating,
    /** True if an avatar upload is in progress */
    isUploadingAvatar,
    /** Any error that occurred during fetching or updating, or null if no error */
    error: error || null,
    /** Function to update profile fields with optimistic updates */
    updateProfile,
    /** Function to update the user's theme preference */
    updateThemePreference,
    /** Function to upload avatar image */
    uploadAvatar,
    /** Function to manually refetch the profile data */
    refetch,
  }
}
