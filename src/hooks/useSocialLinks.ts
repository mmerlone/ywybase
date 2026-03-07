'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { QUERY_KEYS } from '@/config/query'
import { logger } from '@/lib/logger/client'
import { updateSocialLinks as updateSocialLinksAction } from '@/lib/actions/profile'
import type { Profile, SocialLink } from '@/types/profile.types'
import type { SocialLinksArrayData } from '@/lib/validators/profile'

/**
 * Social links management hook with React Query integration.
 *
 * Provides mutations for updating social links with optimistic updates and automatic cache invalidation.
 * Integrates with the profile cache to ensure consistency across the application.
 *
 * @param {string} userId - The user ID for the social links
 * @returns {UseSocialLinksReturn} Object containing:
 * - `updateLinks`: Function to update all social links with optimistic updates
 * - `addLink`: Function to add a single link to existing links
 * - `updateLink`: Function to update a single link by ID
 * - `deleteLink`: Function to delete a link by ID
 * - `isUpdating`: Loading state for mutations
 *
 * @example
 * ```tsx
 * function SocialLinksManager({ userId }: { userId: string }) {
 *   const { addLink, deleteLink, isUpdating } = useSocialLinks(userId);
 *
 *   const handleAdd = async (link: SocialLink) => {
 *     try {
 *       await addLink(link);
 *       // Show success message
 *     } catch (err) {
 *       // Handle error
 *     }
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={() => handleAdd(newLink)} disabled={isUpdating}>
 *         Add Link
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSocialLinks(userId: string): {
  updateLinks: (links: SocialLinksArrayData) => Promise<Profile>
  addLink: (link: SocialLink) => Promise<Profile>
  updateLink: (linkId: string, updates: Partial<SocialLink>) => Promise<Profile>
  deleteLink: (linkId: string) => Promise<Profile>
  isUpdating: boolean
} {
  const queryClient = useQueryClient()

  // Base mutation for updating social links
  const { mutateAsync: updateLinks, isPending: isUpdating } = useMutation({
    mutationFn: async (links: SocialLinksArrayData): Promise<Profile> => {
      logger.debug({ userId, linkCount: links.length }, 'Updating social links')

      const result = await updateSocialLinksAction(userId, links)

      if (!result.success) {
        const errorMessage = typeof result.error === 'string' ? result.error : 'Failed to update social links'
        throw new Error(errorMessage)
      }

      if (!result.data) {
        throw new Error('No data returned from server')
      }

      return result.data
    },
    onMutate: async (newLinks) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.profile(userId) })

      // Snapshot previous profile data
      const previousProfile = queryClient.getQueryData<Profile>(QUERY_KEYS.profile(userId))

      // Optimistically update profile cache
      if (previousProfile) {
        queryClient.setQueryData<Profile>(QUERY_KEYS.profile(userId), {
          ...previousProfile,
          social_links: newLinks,
        })
      }

      return { previousProfile }
    },
    onError: (err, newLinks, context) => {
      logger.error({ userId, error: err, linkCount: newLinks.length }, 'Failed to update social links')

      // Rollback to previous profile on error
      if (context?.previousProfile) {
        queryClient.setQueryData(QUERY_KEYS.profile(userId), context.previousProfile)
      }
    },
    onSuccess: (updatedProfile) => {
      logger.info({ userId, linkCount: updatedProfile.social_links?.length ?? 0 }, 'Social links updated successfully')

      // Update profile cache with server response
      queryClient.setQueryData(QUERY_KEYS.profile(userId), updatedProfile)
    },
    onSettled: () => {
      // Invalidate profile queries to ensure consistency
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile(userId) }).catch((err) => {
        logger.error({ userId, error: err }, 'Failed to invalidate profile queries')
      })
    },
  })

  /**
   * Add a single link to existing links.
   */
  const addLink = useCallback(
    async (link: SocialLink): Promise<Profile> => {
      const currentProfile = queryClient.getQueryData<Profile>(QUERY_KEYS.profile(userId))
      const currentLinks = currentProfile?.social_links ?? []

      // Cast to the validated array data type
      return updateLinks([...currentLinks, link] as SocialLinksArrayData)
    },
    [queryClient, updateLinks, userId]
  )

  /**
   * Update a single link by ID.
   */
  const updateLink = useCallback(
    async (linkId: string, updates: Partial<SocialLink>): Promise<Profile> => {
      const currentProfile = queryClient.getQueryData<Profile>(QUERY_KEYS.profile(userId))
      const currentLinks = currentProfile?.social_links ?? []

      const updatedLinks = currentLinks.map((link) => (link.id === linkId ? { ...link, ...updates } : link))

      // Cast to the validated array data type
      return updateLinks(updatedLinks as SocialLinksArrayData)
    },
    [queryClient, updateLinks, userId]
  )

  /**
   * Delete a link by ID.
   */
  const deleteLink = useCallback(
    async (linkId: string): Promise<Profile> => {
      const currentProfile = queryClient.getQueryData<Profile>(QUERY_KEYS.profile(userId))
      const currentLinks = currentProfile?.social_links ?? []

      const filteredLinks = currentLinks.filter((link) => link.id !== linkId)

      // Cast to the validated array data type
      return updateLinks(filteredLinks as SocialLinksArrayData)
    },
    [queryClient, updateLinks, userId]
  )

  return {
    updateLinks,
    addLink,
    updateLink,
    deleteLink,
    isUpdating,
  }
}
