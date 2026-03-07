'use client'

import {
  Login as LoginIcon,
  Logout as LogoutIcon,
  PersonAdd as PersonAddIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import {
  Avatar,
  Box,
  Button,
  Divider,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Skeleton,
  Tooltip,
} from '@mui/material'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { useAuthContext, useCurrentUser } from '@/components/providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { logger } from '@/lib/logger/client'
import { SignOutReasonEnum } from '@/types/auth.types'

/**
 * User menu component that displays different UI based on authentication state
 * Shows login/sign up buttons when not authenticated, and user avatar with menu when authenticated
 */
export function UserMenu(): JSX.Element {
  const { user: authUser, isLoading: authLoading } = useCurrentUser()
  const { signOut } = useAuthContext()
  const { profile, isLoading: isProfileLoading } = useProfile(authUser?.id)
  const isLoading = authLoading ?? isProfileLoading
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
  const router = useRouter()
  const open = Boolean(anchorEl)
  const displayName = profile?.display_name ?? authUser?.email?.split('@')[0] ?? 'User'
  const avatarUrl = (profile?.avatar_url ?? authUser?.user_metadata?.avatar_url ?? '') as string

  const handleClick = (event: React.MouseEvent<HTMLElement>): void => {
    setAnchorEl(event.currentTarget)
  }

  const handleClose = (): void => {
    setAnchorEl(null)
  }

  const handleSignOut = async (): Promise<void> => {
    try {
      const { error } = await signOut(SignOutReasonEnum.USER_ACTION)
      if (error) {
        logger.error({ error }, 'Error signing out')
        return
      }
      router.refresh()
      router.push('/')
    } catch (error) {
      logger.error({ error }, 'Unexpected error during sign out')
    } finally {
      handleClose()
    }
  }

  // Loading state: Show skeleton matching the avatar button shape
  if (isLoading) {
    return (
      <IconButton size="small" disabled sx={{ ml: 2 }}>
        <Skeleton variant="circular" width={32} height={32} />
      </IconButton>
    )
  }

  if (!authUser) {
    return (
      <Box sx={{ display: 'flex', gap: 2 }}>
        <Button
          component={Link}
          href="/auth?op=login"
          variant="outlined"
          color="inherit"
          size="small"
          startIcon={<LoginIcon />}>
          Login
        </Button>
        <Button
          component={Link}
          href="/auth?op=sign-up"
          variant="contained"
          color="primary"
          size="small"
          startIcon={<PersonAddIcon />}
          sx={{
            color: (theme) => theme.palette.primary.contrastText,
          }}>
          Sign Up
        </Button>
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      <Tooltip title="Account settings">
        <IconButton
          onClick={handleClick}
          size="small"
          sx={{ ml: 2 }}
          aria-controls={open ? 'account-menu' : undefined}
          aria-haspopup="true"
          aria-expanded={open ? 'true' : undefined}>
          <Avatar
            alt={displayName}
            src={avatarUrl ?? undefined}
            sx={{
              width: 32,
              height: 32,
              bgcolor: 'primary.dark',
              color: 'common.white',
              fontSize: '0.875rem',
              fontWeight: 600,
            }}>
            {!avatarUrl && displayName.charAt(0).toUpperCase()}
          </Avatar>
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        disableScrollLock={true}
        slotProps={{
          list: {
            'aria-labelledby': 'account-menu-button',
            'aria-hidden': !open,
            role: 'menu',
          },
          paper: {
            elevation: 8,
            sx: {
              overflow: 'visible',
              mt: 1.5,
              minWidth: 180,
              '& .MuiAvatar-root': {
                width: 32,
                height: 32,
                ml: -0.5,
                mr: 1,
              },
              '&:before': {
                content: '""',
                display: 'block',
                position: 'absolute',
                top: 0,
                right: 14,
                width: 10,
                height: 10,
                bgcolor: 'background.paper',
                transform: 'translateY(-50%) rotate(45deg)',
                zIndex: 0,
              },
            },
          },
          root: {
            // This ensures the menu is removed from the accessibility tree when closed
            // and doesn't interfere with focus management
            'aria-hidden': !open,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
        <MenuItem component={Link} href="/profile" onClick={handleClose}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </Box>
  )
}
