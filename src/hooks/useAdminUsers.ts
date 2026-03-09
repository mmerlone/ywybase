'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

import { PAGINATION_CONFIG, QUERY_CONFIG, QUERY_KEYS } from '@/config/query'
import { BusinessError } from '@/lib/error/errors'
import { handleError as handleClientError } from '@/lib/error/handlers/client.handler'
import type { AuthResponse } from '@/types/error.types'
import type { PaginatedProfilesResult, ProfilesQueryOptions } from '@/types/admin.types'
import type { Profile } from '@/types/profile.types'
import { toErrorOrNull } from '@/types/logger.types'

type FetchProfilesAction = (options: ProfilesQueryOptions) => Promise<AuthResponse<PaginatedProfilesResult>>
type FetchProfileAction = (profileId: string) => Promise<AuthResponse<Profile>>
type BlockUserAction = (profileId: string) => Promise<AuthResponse<Profile>>
type DeleteUserAction = (profileId: string) => Promise<AuthResponse<void>>

/**
 * Hook for managing the paginated list of profiles in the admin dashboard.
 * Returns profiles with synced auth metadata (created_at, confirmed_at, last_sign_in_at, providers).
 *
 * @param options - Query options for pagination and filtering
 */
export function useAdminProfiles(
  options: ProfilesQueryOptions = {},
  { fetchProfiles }: { fetchProfiles: FetchProfilesAction }
): {
  profiles: Profile[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
} {
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery<PaginatedProfilesResult | null>({
    queryKey: QUERY_KEYS.adminProfiles(options),
    queryFn: async () => {
      try {
        const result = await fetchProfiles(options)
        if (result.success === false) {
          throw handleClientError(result.error, {
            operation: 'fetchProfiles',
            // profiles options don't fit BaseErrorContext, so we omit for now or put in detail if needed
          })
        }
        return result.data ?? null
      } catch (err) {
        // Log is already handled by handleClientError if it's new
        throw err
      }
    },
    staleTime: QUERY_CONFIG.admin.staleTime,
    gcTime: QUERY_CONFIG.admin.gcTime,
    // Keep previous data while fetching new pages for smoother UI transitions
    placeholderData: (previousData) => previousData,
    retry: (failureCount, err) => {
      if (
        err instanceof BusinessError &&
        err.statusCode !== null &&
        err.statusCode !== undefined &&
        QUERY_CONFIG.retry.nonRetryableStatusCodes.includes(err.statusCode as 400 | 401 | 403 | 404)
      ) {
        return false
      }
      return failureCount < QUERY_CONFIG.retry.maxAttempts
    },
  })

  return {
    profiles: data?.data ?? [],
    total: data?.count ?? 0,
    page: data?.page ?? 1,
    pageSize: data?.pageSize ?? PAGINATION_CONFIG.adminProfiles.defaultPageSize,
    totalPages: data?.pageCount ?? 0,
    isLoading,
    isFetching,
    error: toErrorOrNull(error as unknown),
    refetch: (): void => {
      void queryRefetch().catch(() => {})
    },
  }
}

/**
 * Hook for fetching detailed information for a specific profile.
 * Returns profile with synced auth metadata fields.
 *
 * @param profileId - The ID of the profile to fetch
 */
export function useProfileDetails(
  profileId: string | undefined,
  { fetchProfile, initialData }: { fetchProfile: FetchProfileAction; initialData?: Profile | null }
): {
  profile: Profile | null
  isLoading: boolean
  isFetching: boolean
  error: Error | null
  refetch: () => void
} {
  const {
    data: profile,
    isLoading,
    isFetching,
    error,
    refetch: queryRefetch,
  } = useQuery<Profile | null>({
    queryKey: QUERY_KEYS.adminProfile(profileId),
    queryFn: async () => {
      if (profileId === undefined) return null
      try {
        const result = await fetchProfile(profileId)
        if (!result.success) {
          throw handleClientError(result.error, {
            operation: 'fetchProfile',
            userId: profileId,
          })
        }
        return result.data ?? null
      } catch (err) {
        // Log is already handled by handleClientError if it's new
        throw err
      }
    },
    enabled: profileId !== undefined,
    initialData: initialData ?? undefined,
    refetchOnMount: false,
    staleTime: QUERY_CONFIG.admin.staleTime,
    gcTime: QUERY_CONFIG.admin.gcTime,
    retry: (failureCount, err) => {
      if (
        err instanceof BusinessError &&
        err.statusCode !== null &&
        err.statusCode !== undefined &&
        QUERY_CONFIG.retry.nonRetryableStatusCodes.includes(err.statusCode as 400 | 401 | 403 | 404)
      ) {
        return false
      }
      return failureCount < QUERY_CONFIG.retry.maxAttempts
    },
  })

  return {
    profile: profile ?? null,
    isLoading,
    isFetching,
    error: toErrorOrNull(error),
    refetch: (): void => {
      void queryRefetch().catch(() => {})
    },
  }
}

/**
 * Hook for blocking a user (setting status to SUSPENDED).
 *
 * @returns Mutation function and loading state
 */
export function useBlockUser({ blockUserAction }: { blockUserAction: BlockUserAction }): {
  blockUser: (profileId: string) => Promise<Profile>
  isPending: boolean
} {
  const queryClient = useQueryClient()

  const { mutateAsync: blockUserMutation, isPending } = useMutation<Profile, Error, string>({
    mutationKey: ['admin', 'block-user'],
    mutationFn: async (profileId: string): Promise<Profile> => {
      try {
        const result = await blockUserAction(profileId)
        if (result.success === false || result.data === null) {
          throw handleClientError(result.error, {
            operation: 'blockUser',
            userId: profileId,
          })
        }
        return result.data as Profile
      } catch (err) {
        // Log is already handled by handleClientError if it's new
        throw err
      }
    },
    onSuccess: async (data, profileId) => {
      // Invalidate profile details and profiles list queries
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminProfile(profileId),
      })
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminProfiles(),
      })
    },
  })

  return {
    blockUser: blockUserMutation,
    isPending,
  }
}

/**
 * Hook for deleting a user permanently.
 *
 * @returns Mutation function and loading state
 */
export function useDeleteUser({ deleteUserAction }: { deleteUserAction: DeleteUserAction }): {
  deleteUser: (profileId: string) => Promise<void>
  isPending: boolean
} {
  const queryClient = useQueryClient()

  const { mutateAsync: deleteUserMutation, isPending } = useMutation<void, Error, string>({
    mutationKey: ['admin', 'delete-user'],
    mutationFn: async (profileId: string) => {
      try {
        const result = await deleteUserAction(profileId)
        if (result.success === false) {
          throw handleClientError(result.error, {
            operation: 'deleteUser',
            userId: profileId,
          })
        }
        return undefined
      } catch (err) {
        // Log is already handled by handleClientError if it's new
        throw err
      }
    },
    onSuccess: async (_, profileId) => {
      // Invalidate profiles list query
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminProfiles(),
      })
      // Also invalidate the deleted profile's detail query
      await queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.adminProfile(profileId),
      })
    },
  })

  return {
    deleteUser: deleteUserMutation,
    isPending,
  }
}
