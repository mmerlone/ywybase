import { CameraAlt, Delete } from '@mui/icons-material'
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Tooltip,
} from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import { UserAvatar, AVATAR_SIZE_CONFIG } from '@/components/profile/UserAvatar'
import { useProfile } from '@/hooks/useProfile'
import { logger } from '@/lib/logger/client'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/**
 * Props for the UserAvatarForm component
 */
export interface UserAvatarFormProps {
  /**
   * Avatar image URL from Supabase Storage
   * Will be optimized using useOptimizedAvatar hook
   */
  avatarUrl: string | null | undefined

  /**
   * User's email address for fallback initials
   */
  email?: string

  /**
   * User's display name for fallback initials
   */
  displayName?: string

  /**
   * Avatar size preset
   * - thumbnail: 32x32 (table rows)
   * - small: 72x72 (dashboard cards)
   * - medium: 120x120 (profile cards)
   * - large: 150-200px responsive (profile page)
   * Default: 'medium'
   */
  size?: keyof typeof AVATAR_SIZE_CONFIG

  /**
   * User ID for profile operations (required if editable=true)
   * Used for useProfile hook to upload/delete avatar
   */
  userId?: string
}

/**
 * Avatar form component with editing capabilities
 *
 * Displays user avatar with upload/delete controls.
 * Wraps the simple UserAvatar component with editing functionality.
 * Use within UserCard for full profile display including name, email, and badges.
 * For read-only display, use UserAvatar component directly.
 *
 * @example
 * ```tsx
 * <UserAvatarForm
 *   avatarUrl={profile.avatar_url}
 *   email={profile.email}
 *   displayName={profile.display_name}
 *   userId={user.id}
 *   size="small"
 * />
 * ```
 */
export function UserAvatarForm({
  avatarUrl,
  email,
  displayName,
  size = 'medium',
  userId,
}: UserAvatarFormProps): JSX.Element {
  // Hooks must be called unconditionally (React rules of hooks)
  // We use the userId to determine if profile operations are available
  const profileOps = useProfile(userId)

  // State (only for editable mode)
  const [isUploading, setIsUploading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Size configuration
  const sizeConfig = AVATAR_SIZE_CONFIG[size]

  // Determine if editing is actually available
  const canEdit = userId && profileOps !== null

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
      event.preventDefault()
      event.stopPropagation()

      if (!canEdit || !profileOps) {
        logger.warn({ userId, op: 'uploadAvatar' }, 'Cannot upload avatar without profile operations')
        return
      }

      const file = event.target.files?.[0]
      if (!file) return

      if (!VALID_FILE_TYPES.includes(file.type)) {
        logger.warn({ userId, op: 'uploadAvatar', fileType: file.type }, 'Invalid file type for avatar upload')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        logger.warn(
          { userId, op: 'uploadAvatar', fileSize: file.size, maxSize: MAX_FILE_SIZE },
          'File size too large for avatar upload'
        )
        return
      }

      try {
        setIsUploading(true)
        logger.debug({ userId, op: 'uploadAvatar', fileName: file.name, fileSize: file.size }, 'Starting avatar upload')

        const uploadedUrl = await profileOps.uploadAvatar(file)
        if (uploadedUrl) {
          logger.debug({ userId, op: 'uploadAvatar' }, 'Avatar upload completed successfully')
        }
      } catch (err) {
        logger.error({ error: err, userId, op: 'uploadAvatar' }, 'Failed to upload avatar')
      } finally {
        setIsUploading(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [canEdit, profileOps, userId]
  )

  const handleRemoveAvatar = useCallback(async (event: React.MouseEvent): Promise<void> => {
    event.preventDefault()
    event.stopPropagation()
    setConfirmDelete(true)
  }, [])

  const handleConfirmDelete = useCallback(async (): Promise<void> => {
    setConfirmDelete(false)

    if (!canEdit || !profileOps) {
      logger.warn({ userId, op: 'deleteAvatar' }, 'Cannot remove avatar without profile operations')
      return
    }

    try {
      setIsUploading(true)
      logger.debug({ userId, op: 'deleteAvatar' }, 'Starting avatar removal')
      await profileOps.deleteAvatar()
      logger.debug({ userId, op: 'deleteAvatar' }, 'Avatar removal completed successfully')
    } catch (err) {
      logger.error({ error: err, userId, op: 'deleteAvatar' }, 'Failed to remove avatar')
    } finally {
      setIsUploading(false)
    }
  }, [canEdit, profileOps, userId])

  return (
    <Box
      sx={{
        position: 'relative',
        width: sizeConfig.width,
        height: sizeConfig.height,
      }}
      onMouseEnter={canEdit ? (): void => setIsHovered(true) : undefined}
      onMouseLeave={canEdit ? (): void => setIsHovered(false) : undefined}>
      <Box
        sx={{
          width: '100%',
          height: '100%',
          transition: canEdit ? 'opacity 0.3s ease' : 'none',
          opacity: isHovered ? 0.8 : 1,
        }}>
        <UserAvatar avatarUrl={avatarUrl} email={email} displayName={displayName} size={size} />
      </Box>

      {/* Hover overlay with edit/delete (only if canEdit) */}
      {canEdit && isHovered && (
        <Box
          className="avatar-overlay"
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 2,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
            opacity: 1,
            transition: 'opacity 0.3s ease',
          }}>
          <Tooltip title="Change photo">
            <IconButton
              color="primary"
              component="label"
              disabled={isUploading}
              aria-label="Change avatar photo"
              sx={{
                backgroundColor: 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}>
              <CameraAlt />
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept={VALID_FILE_TYPES.join(',')}
                onChange={handleFileChange}
              />
            </IconButton>
          </Tooltip>

          {Boolean(avatarUrl) && (
            <Tooltip title="Remove photo">
              <IconButton
                color="error"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
                aria-label="Remove avatar photo"
                sx={{
                  backgroundColor: 'background.paper',
                  '&:hover': {
                    backgroundColor: 'error.light',
                    color: 'error.contrastText',
                  },
                }}>
                <Delete />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}

      {/* Loading overlay (only if uploading) */}
      {isUploading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '50%',
          }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Confirmation dialog for avatar deletion */}
      <Dialog
        open={confirmDelete}
        onClose={(): void => setConfirmDelete(false)}
        aria-labelledby="delete-avatar-dialog-title"
        aria-describedby="delete-avatar-dialog-description">
        <DialogTitle id="delete-avatar-dialog-title">Remove Avatar</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-avatar-dialog-description">
            Are you sure you want to remove your avatar? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={(): void => setConfirmDelete(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained" autoFocus>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
