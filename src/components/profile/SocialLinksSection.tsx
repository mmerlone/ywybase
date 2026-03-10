'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import React, { useState, useCallback, type ReactElement } from 'react'

import { SocialLinkCard } from './SocialLinkCard'
import { SocialLinkForm, type OgMeta } from './SocialLinkForm'
import { useSnackbar } from '@/contexts/SnackbarContext'
import { useProfile } from '@/hooks/useProfile'
import { useSocialLinks } from '@/hooks/useSocialLinks'
import { socialLinkSchema, type SocialLinkFormData } from '@/lib/validators/profile'
import { MAX_SOCIAL_LINKS, SOCIAL_PLATFORMS } from '@/config/social'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { type SocialLink, type SocialProvider } from '@/types/profile.types'
import { logger } from '@/lib/logger/client'
import { getOgMetaFromAuth } from '@/lib/utils/social-og'
import { fetchSocialMetadata } from '@/lib/actions/social'

/**
 * TTL for metadata cache (30 days in milliseconds).
 */
const METADATA_TTL_MS = 30 * 24 * 60 * 60 * 1000

/**
 * SocialLinksSection - Dynamic array of social link cards with inline add/edit forms and OG metadata fetching.
 *
 * @remarks
 * Features:
 * - Inline add/edit forms with smooth height transitions
 * - Platform dropdown with all SOCIAL_PLATFORMS
 * - URL and title inputs with real-time validation
 * - "Fetch Preview" button to get OG metadata via Server Action
 * - Display fetched metadata preview (title, description, image)
 * - Automatic metadata staleness detection (30-day TTL)
 * - Uses useSocialLinks hook for mutations with optimistic updates
 * - Generates UUID for new links using crypto.randomUUID()
 * - Comprehensive error handling with useSnackbar
 *
 * @returns ReactElement - The social links section component
 */
export function SocialLinksSection(): ReactElement {
  const { showSuccess, showError } = useSnackbar()
  const { user } = useCurrentUser()
  const userId = user?.id ?? ''
  const { profile } = useProfile(userId)
  const { addLink, updateLink, deleteLink, isUpdating } = useSocialLinks(userId)

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fetchingMeta, setFetchingMeta] = useState(false)
  const [metaPreview, setMetaPreview] = useState<OgMeta | null>(null)

  const socialLinks = profile?.social_links ?? []

  // Get currently used platforms to prevent duplicates
  const usedPlatforms = socialLinks
    .filter((link) => link.id !== editingId)
    .map((link) => link.platform)
    .filter(Boolean)

  /**
   * Gets OG metadata from connected auth provider metadata when available.
   */
  const getConnectedProviderOgMeta = useCallback(
    (platform: SocialProvider): OgMeta | null => {
      if (!user) return null

      const platformConfig = SOCIAL_PLATFORMS.find((p) => p.key === platform)
      if (!platformConfig?.ogMapping) return null

      const identity = user.identities?.find((id) => id.provider === platform)
      if (!identity) return null

      const rawMeta = (identity.identity_data ?? user.user_metadata) as Record<string, unknown> | undefined
      if (!rawMeta) return null

      return getOgMetaFromAuth(platformConfig, rawMeta)
    },
    [user]
  )

  /**
   * Checks if metadata is stale (older than TTL).
   */
  const isMetadataStale = useCallback((link: SocialLink): boolean => {
    if (!link.metadata) return true
    const metadataAny = link.metadata as { fetchedAt?: string }
    if (!metadataAny.fetchedAt) return true
    const fetchedAt = new Date(metadataAny.fetchedAt).getTime()
    const now = Date.now()
    return now - fetchedAt > METADATA_TTL_MS
  }, [])

  /**
   * Fetches OG metadata for a given URL.
   * Returns metadata on success, or null on error (with snackbar notification).
   * Handles soft errors gracefully (when site blocks automated requests).
   */
  const fetchMetadata = useCallback(
    async (url: string): Promise<OgMeta | null> => {
      if (!url?.startsWith('https://')) {
        showError('Please enter a valid HTTPS URL')
        return null
      }

      setFetchingMeta(true)
      try {
        const result = await fetchSocialMetadata(url)
        if (!result.success) {
          const errMsg = typeof result.error === 'string' ? result.error : 'Failed to fetch metadata'
          throw new Error(errMsg)
        }

        const data = result.data
        if (data?.error !== undefined) {
          logger.warn({ url, error: data.error }, 'Metadata fetch returned soft error')
          showError(data.error)
          setMetaPreview(null)
          return null
        }

        if (data === undefined) return null

        setMetaPreview(data)
        logger.info({ url, metadata: data }, 'Fetched OG metadata')
        return data
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        logger.error({ error: err, url }, 'Failed to fetch metadata')
        showError(err.message)
        setMetaPreview(null)
        return null
      } finally {
        setFetchingMeta(false)
      }
    },
    [showError]
  )

  /**
   * Handles adding a new social link.
   */
  const handleAdd = useCallback(
    async (data: SocialLinkFormData): Promise<void> => {
      try {
        const providerMeta = getConnectedProviderOgMeta(data.platform)
        const resolvedMeta = providerMeta ?? metaPreview
        const newLink: SocialLink = {
          id: crypto.randomUUID(),
          url: data.url,
          title: data.title,
          platform: data.platform,
          metadata: resolvedMeta
            ? {
                ...resolvedMeta,
                fetchedAt: new Date().toISOString(),
                ttl: METADATA_TTL_MS,
              }
            : undefined,
        }

        // Validate with Zod schema
        const validated = socialLinkSchema.parse(newLink)

        await addLink(validated)
        showSuccess('Social link added successfully')
        setIsAdding(false)
        setMetaPreview(null)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        logger.error({ error: err, data }, 'Failed to add social link')
        showError(`Failed to add link: ${err.message}`)
      }
    },
    [addLink, showSuccess, showError, metaPreview, getConnectedProviderOgMeta]
  )

  /**
   * Handles updating an existing social link.
   */
  const handleUpdate = useCallback(
    async (linkId: string, data: SocialLinkFormData): Promise<void> => {
      try {
        const updates: Partial<SocialLink> = {
          url: data.url,
          title: data.title,
          platform: data.platform,
          metadata: metaPreview
            ? {
                ...metaPreview,
                fetchedAt: new Date().toISOString(),
                ttl: METADATA_TTL_MS,
              }
            : undefined,
        }

        await updateLink(linkId, updates)
        showSuccess('Social link updated successfully')
        setEditingId(null)
        setMetaPreview(null)
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        logger.error({ error: err, linkId, data }, 'Failed to update social link')
        showError(`Failed to update link: ${err.message}`)
      }
    },
    [updateLink, showSuccess, showError, metaPreview]
  )

  /**
   * Handles deleting a social link.
   */
  const handleDelete = useCallback(
    async (linkId: string): Promise<void> => {
      try {
        await deleteLink(linkId)
        showSuccess('Social link deleted successfully')
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error')
        logger.error({ error: err, linkId }, 'Failed to delete social link')
        showError(`Failed to delete link: ${err.message}`)
      }
    },
    [deleteLink, showSuccess, showError]
  )

  /**
   * Handles editing a social link.
   */
  const handleEdit = useCallback((link: SocialLink): void => {
    setEditingId(link.id)
    setMetaPreview(link.metadata ?? null)
    setIsAdding(false)
  }, [])

  /**
   * Cancels add or edit mode.
   */
  const handleCancel = useCallback((): void => {
    setIsAdding(false)
    setEditingId(null)
    setMetaPreview(null)
  }, [])

  return (
    <Box component="section" aria-labelledby="social-links-heading">
      <Typography variant="h6" component="h2" id="social-links-heading" sx={{ mb: 2 }}>
        Social Links
      </Typography>
      <Grid container spacing={2} component="ul" sx={{ listStyle: 'none', m: 0, p: 0 }}>
        {socialLinks.map((link) => {
          const isEditing = editingId === link.id

          if (isEditing) {
            return (
              <Grid size={{ xs: 12, sm: 6 }} component="li" key={link.id}>
                <SocialLinkForm
                  mode="edit"
                  initialData={{
                    platform: link.platform as SocialProvider,
                    url: link.url,
                    title: link.title,
                  }}
                  onSubmit={(data) => handleUpdate(link.id, data)}
                  onCancel={handleCancel}
                  onFetchMetadata={fetchMetadata}
                  metaPreview={metaPreview}
                  fetchingMeta={fetchingMeta}
                  isSubmitting={isUpdating}
                  usedPlatforms={usedPlatforms}
                  isStale={isMetadataStale(link)}
                />
              </Grid>
            )
          }

          return (
            <Grid size={{ xs: 12, sm: 6 }} component="li" key={link.id}>
              <SocialLinkCard
                link={link}
                onEdit={() => handleEdit(link)}
                onDelete={() => handleDelete(link.id)}
                editable
                userAvatarUrl={profile?.avatar_url}
                userEmail={profile?.email}
                userDisplayName={profile?.display_name}
              />
            </Grid>
          )
        })}

        {/* Add new link form or button */}
        {socialLinks.length < MAX_SOCIAL_LINKS && (
          <Grid size={{ xs: 12, sm: 6 }} component="li">
            {isAdding ? (
              <SocialLinkForm
                mode="add"
                onSubmit={handleAdd}
                onCancel={handleCancel}
                onFetchMetadata={fetchMetadata}
                metaPreview={metaPreview}
                fetchingMeta={fetchingMeta}
                isSubmitting={isUpdating}
                usedPlatforms={usedPlatforms}
              />
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setIsAdding(true)}
                disabled={isUpdating}
                sx={{
                  height: 150,
                  fontSize: 18,
                  borderStyle: 'dashed',
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    borderStyle: 'solid',
                    transform: 'scale(1.02)',
                  },
                }}>
                + Add Social Link
              </Button>
            )}
          </Grid>
        )}
      </Grid>
    </Box>
  )
}
