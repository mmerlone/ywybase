'use client'

import { Chip, type ChipProps } from '@mui/material'
import {
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Security as ModeratorIcon,
  Star as RootIcon,
} from '@mui/icons-material'
import { UserRoleEnum } from '@/types/admin.types'
import { type Profile } from '@/types/profile.types'

/**
 * Props for UserRoleBadge component.
 */
interface UserRoleBadgeProps {
  /** The user's role from their profile */
  role: Profile['role']
}

/**
 * Displays a colored chip badge with an icon indicating the user's role.
 *
 * Role styling:
 * - Root: red with star icon
 * - Admin: blue with admin panel icon
 * - Moderator: light blue with security icon
 * - User: grey with person icon
 *
 * @param props - Component props containing the user role
 * @returns A styled Chip component with icon showing the role
 */
export function UserRoleBadge({ role }: UserRoleBadgeProps): JSX.Element {
  const getRoleInfo = (): { color: ChipProps['color']; icon: JSX.Element; label: string } => {
    switch (role) {
      case UserRoleEnum.ROOT:
        return { color: 'error', icon: <RootIcon sx={{ fontSize: 16 }} />, label: 'Root' }
      case UserRoleEnum.ADMIN:
        return { color: 'primary', icon: <AdminIcon sx={{ fontSize: 16 }} />, label: 'Admin' }
      case UserRoleEnum.MODERATOR:
        return { color: 'info', icon: <ModeratorIcon sx={{ fontSize: 16 }} />, label: 'Moderator' }
      case UserRoleEnum.USER:
      default:
        return { color: 'default', icon: <UserIcon sx={{ fontSize: 16 }} />, label: 'User' }
    }
  }

  const info = getRoleInfo()

  return (
    <Chip
      icon={info.icon}
      label={info.label}
      size="small"
      variant="filled"
      sx={{
        backgroundColor:
          info.color === 'default'
            ? 'rgba(255, 255, 255, 0.15)'
            : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.2)`,
        color: info.color === 'default' ? 'rgba(255, 255, 255, 0.9)' : `var(--mui-palette-${info.color}-main)`,
        fontWeight: 600,
        border: '1px solid rgba(255, 255, 255, 0.1)',
        '&:hover': {
          backgroundColor:
            info.color === 'default'
              ? 'rgba(255, 255, 255, 0.25)'
              : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.3)`,
        },
      }}
    />
  )
}
