'use client'

import {
  AccessTime as PendingIcon,
  Block as SuspendedIcon,
  CheckCircle as ActiveIcon,
  HelpOutline as UnknownIcon,
  RemoveCircleOutline as InactiveIcon,
} from '@mui/icons-material'
import { Chip, type ChipProps } from '@mui/material'

import { type Profile, UserStatusEnum } from '@/types/profile.types'

type UserBadgeVariant = 'default' | 'inverse'

interface UserStatusBadgeProps {
  /** The user's current status from their profile. */
  status: Profile['status']
  /** Visual treatment for light vs dark surfaces. */
  variant?: UserBadgeVariant
}

function getStatusInfo(status: Profile['status']): { color: ChipProps['color']; icon: JSX.Element; label: string } {
  switch (status) {
    case UserStatusEnum.ACTIVE:
      return { color: 'success', icon: <ActiveIcon sx={{ fontSize: 16 }} />, label: 'Active' }
    case UserStatusEnum.INACTIVE:
      return { color: 'default', icon: <InactiveIcon sx={{ fontSize: 16 }} />, label: 'Inactive' }
    case UserStatusEnum.SUSPENDED:
      return { color: 'error', icon: <SuspendedIcon sx={{ fontSize: 16 }} />, label: 'Suspended' }
    case UserStatusEnum.PENDING:
      return { color: 'warning', icon: <PendingIcon sx={{ fontSize: 16 }} />, label: 'Pending' }
    default:
      return { color: 'default', icon: <UnknownIcon sx={{ fontSize: 16 }} />, label: 'Unknown' }
  }
}

export function UserStatusBadge({ status, variant = 'default' }: UserStatusBadgeProps): JSX.Element {
  const info = getStatusInfo(status)

  if (variant === 'inverse') {
    return (
      <Chip
        icon={info.icon}
        label={info.label}
        size="small"
        variant="outlined"
        sx={{
          fontWeight: 600,
          textTransform: 'capitalize',
          borderColor: info.color === 'default' ? 'rgba(255, 255, 255, 0.3)' : `var(--mui-palette-${info.color}-main)`,
          color: info.color === 'default' ? 'rgba(255, 255, 255, 0.8)' : `var(--mui-palette-${info.color}-main)`,
          backgroundColor:
            info.color === 'default'
              ? 'rgba(255, 255, 255, 0.05)'
              : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.1)`,
          '&:hover': {
            backgroundColor:
              info.color === 'default'
                ? 'rgba(255, 255, 255, 0.1)'
                : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.2)`,
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
      color={info.color}
      variant="outlined"
      sx={{ fontWeight: 600, textTransform: 'capitalize' }}
    />
  )
}
