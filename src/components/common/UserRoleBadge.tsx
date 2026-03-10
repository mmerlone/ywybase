'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import {
  AdminPanelSettings as AdminIcon,
  Person as UserIcon,
  Security as ModeratorIcon,
  Star as RootIcon,
} from '@mui/icons-material'
import { Chip, type ChipProps } from '@mui/material'

import { UserRoleEnum } from '@/types/admin.types'
import { type Profile } from '@/types/profile.types'

type UserBadgeVariant = 'default' | 'inverse'

interface UserRoleBadgeProps {
  /** The user's role from their profile. */
  role: Profile['role']
  /** Visual treatment for light vs dark surfaces. */
  variant?: UserBadgeVariant
}

function getRoleInfo(role: Profile['role']): { color: ChipProps['color']; icon: ReactElement; label: string } {
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

export function UserRoleBadge({ role, variant = 'default' }: UserRoleBadgeProps): ReactElement {
  const info = getRoleInfo(role)

  if (variant === 'inverse') {
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
          '& .MuiChip-icon': {
            color: 'inherit',
          },
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

  return (
    <Chip
      icon={info.icon}
      label={info.label}
      size="small"
      variant="filled"
      sx={{
        backgroundColor:
          info.color === 'default' ? undefined : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.1)`,
        color: info.color === 'default' ? undefined : `var(--mui-palette-${info.color}-main)`,
        fontWeight: 600,
        '& .MuiChip-icon': {
          color: 'inherit',
        },
      }}
    />
  )
}
