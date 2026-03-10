'use client'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl from '@mui/material/FormControl'
import FormHelperText from '@mui/material/FormHelperText'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import React, { useCallback, useState, type ReactElement } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { socialLinkFormSchema, type SocialLinkFormData } from '@/lib/validators/profile'
import { SOCIAL_PLATFORMS } from '@/config/social'
import { SocialProvidersEnum, type SocialProvider } from '@/types/profile.types'
import { createSafeResolver } from '@/lib/utils/forms'
import type { OgMeta } from '@/lib/utils/social-metadata'

/**
 * Open Graph metadata for a social profile URL.
 * Canonical definition lives in `@/lib/utils/social-metadata`.
 */
export type { OgMeta } from '@/lib/utils/social-metadata'

/**
 * Props for the SocialLinkForm component.
 */
export interface SocialLinkFormProps {
  /** Form mode: 'add' for new links, 'edit' for existing links */
  mode: 'add' | 'edit'
  /** Initial form data (required for edit mode) */
  initialData?: SocialLinkFormData
  /** Callback when form is submitted */
  onSubmit: (data: SocialLinkFormData) => Promise<void>
  /** Callback when form is cancelled */
  onCancel: () => void
  /** Callback to fetch OG metadata for a URL */
  onFetchMetadata: (url: string) => Promise<OgMeta | null>
  /** Current metadata preview (if fetched) */
  metaPreview: OgMeta | null
  /** Whether metadata is currently being fetched */
  fetchingMeta: boolean
  /** Whether form is currently being submitted */
  isSubmitting: boolean
  /** List of platforms already in use (for filtering dropdown) */
  usedPlatforms: (string | undefined)[]
  /** Whether the current metadata is stale (> TTL) */
  isStale?: boolean
}

/**
 * SocialLinkForm - Inline form for adding or editing a social link.
 *
 * @remarks
 * Features:
 * - Platform dropdown (filters out already-used platforms except when editing)
 * - URL input with validation
 * - Title input
 * - "Fetch Preview" button (or "Refresh Preview" if stale)
 * - Metadata preview card
 * - Submit/Cancel buttons with loading states
 * - Smooth height transition animation
 *
 * @param props - Component props
 * @returns ReactElement - The social link form component
 */
export function SocialLinkForm({
  mode,
  initialData,
  onSubmit,
  onCancel,
  onFetchMetadata,
  metaPreview,
  fetchingMeta,
  isSubmitting,
  usedPlatforms,
  isStale = false,
}: SocialLinkFormProps): ReactElement {
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    setValue,
  } = useForm<SocialLinkFormData>({
    resolver: createSafeResolver(socialLinkFormSchema),
    mode: 'onTouched',
    defaultValues: initialData ?? {
      platform: SocialProvidersEnum.WEBSITE as SocialProvider,
      url: '',
      title: '',
    },
  })

  // Maintain current URL in local state to avoid direct top-level `watch()` usage
  // which triggers the "incompatible library" lint warning from React Compiler.
  const [currentUrl, setCurrentUrl] = useState<string>(initialData?.url ?? '')

  // Handle platform change to prefill URL with template
  const handlePlatformChange = useCallback(
    (platform: SocialProvider) => {
      const platformConfig = SOCIAL_PLATFORMS.find((p) => p.key === platform)
      if (platformConfig) {
        setValue('url', platformConfig.urlPrefix)
        setCurrentUrl(platformConfig.urlPrefix)
      }
    },
    [setValue]
  )

  // Filter available platforms (exclude already used, but allow current platform when editing)
  const availablePlatforms = SOCIAL_PLATFORMS.filter((p) => {
    if (mode === 'edit' && p.key === initialData?.platform) return true
    return !usedPlatforms.includes(p.key)
  })

  const handleFetchPreview = useCallback(async (): Promise<void> => {
    if (!currentUrl) return
    await onFetchMetadata(currentUrl)
  }, [currentUrl, onFetchMetadata])

  const handleFormSubmit = handleSubmit(async (data) => {
    await onSubmit(data)
  })

  return (
    <Card
      sx={{
        minHeight: 150,
        transition: 'all 0.3s ease-in-out',
        overflow: 'visible',
      }}>
      <CardContent>
        <form onSubmit={handleFormSubmit}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Platform dropdown */}
            <FormControl fullWidth error={Boolean(errors.platform)} size="small">
              <InputLabel id="platform-label">Platform</InputLabel>
              <Controller
                name="platform"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId="platform-label"
                    label="Platform"
                    disabled={isSubmitting}
                    onChange={(e) => {
                      field.onChange(e)
                      handlePlatformChange(e.target.value as SocialProvider)
                    }}>
                    {availablePlatforms.map((platform) => (
                      <MenuItem key={platform.key} value={platform.key}>
                        {platform.name}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {errors.platform && <FormHelperText>{errors.platform.message}</FormHelperText>}
            </FormControl>

            {/* URL input */}
            <FormControl fullWidth error={Boolean(errors.url)}>
              <Controller
                name="url"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="URL"
                    placeholder="https://..."
                    size="small"
                    disabled={isSubmitting}
                    error={Boolean(errors.url)}
                    helperText={errors.url?.message}
                    onChange={(e) => {
                      field.onChange(e)
                      setCurrentUrl(e.target.value)
                    }}
                  />
                )}
              />
            </FormControl>

            {/* Title input */}
            <FormControl fullWidth error={Boolean(errors.title)}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Title"
                    placeholder="My Profile"
                    size="small"
                    disabled={isSubmitting}
                    error={Boolean(errors.title)}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </FormControl>

            {/* Fetch Preview button */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleFetchPreview}
              disabled={!currentUrl || fetchingMeta || isSubmitting || Boolean(errors.url)}
              startIcon={fetchingMeta ? <CircularProgress size={16} /> : undefined}>
              {fetchingMeta ? 'Fetching...' : isStale ? 'Refresh Preview' : 'Fetch Preview'}
            </Button>

            {/* Metadata preview */}
            {metaPreview && (
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 1,
                  bgcolor: 'action.hover',
                  border: '1px solid',
                  borderColor: 'divider',
                }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                  Preview:
                </Typography>
                {metaPreview.image && (
                  <Box
                    component="img"
                    src={metaPreview.image}
                    alt="Preview"
                    sx={{
                      width: '100%',
                      height: 80,
                      objectFit: 'cover',
                      borderRadius: 1,
                      mb: 1,
                    }}
                  />
                )}
                {metaPreview.title && (
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {metaPreview.title}
                  </Typography>
                )}
                {metaPreview.description && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                    {metaPreview.description}
                  </Typography>
                )}
              </Box>
            )}

            {/* Action buttons */}
            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
              <Button variant="outlined" size="small" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                type="submit"
                disabled={!isValid || isSubmitting}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}>
                {isSubmitting ? 'Saving...' : mode === 'add' ? 'Add' : 'Update'}
              </Button>
            </Box>
          </Box>
        </form>
      </CardContent>
    </Card>
  )
}
