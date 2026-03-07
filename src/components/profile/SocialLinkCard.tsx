import { Box, Card, CardMedia, IconButton, Tooltip, Typography } from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import LinkIcon from '@mui/icons-material/Link'
import { useState } from 'react'
import { type SocialLink, type SocialProvider, SocialProvidersEnum } from '@/types/profile.types'
import { SocialPlatformIcon } from '@/components/icons/SocialPlatformIcon'
import { UserAvatar } from '@/components/profile/UserAvatar'

export const SOCIAL_LINK_CARD_HEIGHT = 160

interface SocialLinkCardProps {
  link: SocialLink
  onEdit: () => void
  onDelete: () => void
  editable?: boolean
  /** Optional user data for avatar fallback when no OG image */
  userAvatarUrl?: string | null
  userEmail?: string
  userDisplayName?: string
}

/**
 * Type guard to validate if a string is a valid SocialProvider.
 */
function isValidSocialProvider(value: unknown): value is SocialProvider {
  if (typeof value !== 'string') return false
  const validValues = Object.values(SocialProvidersEnum) as string[]
  return validValues.includes(value)
}

/**
 * SocialLinkCard - Displays a social link as a rich card with OG metadata, platform icon, and hover edit/delete controls
 */
export function SocialLinkCard({
  link,
  onEdit,
  onDelete,
  editable,
  userAvatarUrl,
  userEmail,
  userDisplayName,
}: SocialLinkCardProps): JSX.Element {
  const [hovered, setHovered] = useState(false)
  const { metadata, platform, url, title } = link

  // Validate platform with type guard, fallback to undefined for safe handling
  const validatedPlatform: SocialProvider | undefined = isValidSocialProvider(platform) ? platform : undefined
  const displayPlatformName =
    typeof platform === 'string' && platform.length > 0
      ? `${platform.charAt(0).toUpperCase()}${platform.slice(1)}`
      : 'Link'

  return (
    <Card
      component={editable ? 'article' : 'a'}
      href={editable ? undefined : url}
      target={editable ? undefined : '_blank'}
      rel={editable ? undefined : 'noopener noreferrer'}
      sx={{
        position: 'relative',
        height: SOCIAL_LINK_CARD_HEIGHT,
        transition: 'box-shadow 0.2s',
        overflow: 'hidden',
        textDecoration: 'none',
        cursor: editable ? 'default' : 'pointer',
        display: 'block',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      elevation={hovered ? 8 : 2}>
      {/* Gradient background */}
      <Box
        sx={(theme) => ({
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #b3ceec 0%, #c7d2fe 100%)'
              : 'linear-gradient(135deg, #1e293b 0%, #243955 100%)',
          opacity: 0.9,
        })}
      />

      {/* Content container */}
      <Box sx={{ position: 'relative', display: 'flex', height: '100%', p: 2, gap: 2 }}>
        {/* Left: Avatar */}
        <Box sx={{ position: 'relative', flexShrink: 0 }}>
          {metadata?.image ? (
            <CardMedia
              component="img"
              image={metadata.image}
              alt={metadata.title ?? title}
              sx={{
                height: 80,
                width: 80,
                borderRadius: 2,
                objectFit: 'cover',
                border: '2px solid',
                borderColor: 'background.paper',
              }}
            />
          ) : userAvatarUrl !== undefined ? (
            <UserAvatar avatarUrl={userAvatarUrl} email={userEmail} displayName={userDisplayName} size="small" />
          ) : (
            <Box
              sx={{
                height: 80,
                width: 80,
                borderRadius: 2,
                border: '2px solid',
                borderColor: 'background.paper',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
              }}>
              <SocialPlatformIcon platform={validatedPlatform} size={40} />
            </Box>
          )}
        </Box>

        {/* Right: Content */}
        <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'start' }}>
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              mb: 0.5,
              py: 0.25,
              alignSelf: 'flex-start',
            }}>
            <SocialPlatformIcon platform={validatedPlatform} size={20} />
            <Typography variant="caption" fontWeight={600} textTransform="capitalize">
              {displayPlatformName}
            </Typography>
          </Box>
          <Typography variant="subtitle1" fontWeight={600} noWrap sx={{ mb: 0.5 }}>
            {metadata?.title ?? title}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}>
            {metadata?.description ?? url}
          </Typography>
        </Box>
      </Box>

      {/* Hover overlay with link/edit/delete (editable mode) */}
      {editable && hovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            display: 'flex',
            gap: 1,
            zIndex: 3,
          }}>
          <Tooltip title="Open link">
            <IconButton
              color="info"
              onClick={(e) => {
                e.stopPropagation()
                window.open(url, '_blank', 'noopener,noreferrer')
              }}
              size="small"
              aria-label={`Open ${metadata?.title ?? title}`}
              sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
              <LinkIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              color="primary"
              onClick={onEdit}
              size="small"
              aria-label={`Edit ${metadata?.title ?? title}`}
              sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              color="error"
              onClick={onDelete}
              size="small"
              aria-label={`Delete ${metadata?.title ?? title}`}
              sx={{ bgcolor: 'background.paper', '&:hover': { bgcolor: 'action.hover' } }}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      )}

      {/* External link icon (non-editable mode) */}
      {!editable && hovered && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 3,
            bgcolor: 'background.paper',
            borderRadius: '50%',
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 2,
          }}>
          <OpenInNewIcon fontSize="small" color="primary" />
        </Box>
      )}
    </Card>
  )
}
