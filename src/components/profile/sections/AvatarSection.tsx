import { CameraAlt, Delete } from '@mui/icons-material'
import { Avatar, Box, CircularProgress, IconButton, Tooltip } from '@mui/material'
import { useCallback, useRef, useState } from 'react'

import { useAuthContext } from '@/components/providers'
import { useProfile } from '@/hooks/useProfile'
import { useOptimizedAvatar } from '@/hooks/useOptimizedAvatar'
import { logger } from '@/lib/logger/client'
import { AVATAR_SIZES } from '@/lib/utils/image-utils'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const VALID_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export function AvatarSection(): JSX.Element {
  const { authUser } = useAuthContext()
  const { profile, uploadAvatar, updateProfile } = useProfile(authUser?.id)
  const avatarUrls = useOptimizedAvatar(profile?.avatar_url ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      event.preventDefault() // Prevent any form submission
      event.stopPropagation() // Stop event bubbling

      const file = event.target.files?.[0]
      if (!file) return

      if (!VALID_FILE_TYPES.includes(file.type)) {
        logger.warn({ fileType: file.type }, 'Invalid file type for avatar upload')
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        logger.warn({ fileSize: file.size }, 'File size too large for avatar upload')
        return
      }

      try {
        setIsUploading(true)
        logger.info({ fileName: file.name, fileSize: file.size }, 'Starting avatar upload')

        // uploadAvatar already updates the profile with the optimized URL
        const uploadedUrl = await uploadAvatar(file)
        if (uploadedUrl) {
          logger.info({ uploadedUrl }, 'Avatar upload completed successfully')
        }
      } catch (err) {
        logger.error({ err }, 'Failed to update avatar')
      } finally {
        setIsUploading(false)
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    },
    [uploadAvatar]
  )

  const handleRemoveAvatar = useCallback(
    async (event: React.MouseEvent) => {
      event.preventDefault() // Prevent any form submission
      event.stopPropagation() // Stop event bubbling

      try {
        setIsUploading(true)
        logger.info({}, 'Starting avatar removal')
        await updateProfile({ avatar_url: null })
        logger.info({}, 'Avatar removal completed successfully')
      } catch (err) {
        logger.error({ err }, 'Failed to remove avatar')
      } finally {
        setIsUploading(false)
      }
    },
    [updateProfile]
  )

  return (
    <Box
      sx={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        p: 2,
      }}>
      <Box
        sx={{
          position: 'relative',
          width: { xs: 150, sm: 180, md: 200 },
          height: { xs: 150, sm: 180, md: 200 },
          '&:hover .avatar-overlay': {
            opacity: 1,
          },
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}>
        <Avatar
          src={avatarUrls.getUrl(AVATAR_SIZES.large) || undefined}
          alt={profile?.display_name ?? 'User'}
          sx={{
            width: '100%',
            height: '100%',
            fontSize: '4rem',
            transition: 'opacity 0.3s ease',
            opacity: isHovered ? 0.8 : 1,
          }}
          slotProps={{
            img: {
              loading: 'lazy',
              // Provide srcSet for responsive images with width descriptors
              ...(avatarUrls.getUrl(AVATAR_SIZES.medium) && avatarUrls.getUrl(AVATAR_SIZES.large)
                ? {
                    srcSet: `${avatarUrls.getUrl(AVATAR_SIZES.medium)} ${AVATAR_SIZES.medium.width}w, ${avatarUrls.getUrl(AVATAR_SIZES.large)} ${AVATAR_SIZES.large.width}w`,
                    sizes: '(max-width: 599px) 150px, (max-width: 899px) 180px, 200px',
                  }
                : {}),
            },
          }}
        />

        {isHovered && (
          <Box
            className="avatar-overlay"
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'end',
              justifyContent: 'space-between',
              gap: 2,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              borderRadius: '50%',
              opacity: 0,
              transition: 'opacity 0.3s ease',
            }}>
            <Tooltip title="Change photo">
              <IconButton
                color="primary"
                component="label"
                disabled={isUploading}
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

            {profile?.avatar_url != null && (
              <Tooltip title="Remove photo">
                <IconButton
                  color="error"
                  onClick={handleRemoveAvatar}
                  disabled={isUploading}
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
      </Box>
    </Box>
  )
}
