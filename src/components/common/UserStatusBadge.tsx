'use client'
import type React from 'react'
import type { ReactElement } from 'react'

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

function getStatusInfo(status: Profile['status']): { color: ChipProps['color']; icon: ReactElement; label: string } {
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

export function UserStatusBadge({ status, variant = 'default' }: UserStatusBadgeProps): ReactElement {
  const info = getStatusInfo(status)

  if (variant === 'inverse') {
    return (
      <Chip
        icon={info.icon}
        label={info.label}
        size="small"
        variant="outlined"
        sx={(theme) => ({
          fontWeight: 600,
          textTransform: 'capitalize',
          borderColor:
            info.color === 'default'
              ? `color-mix(in srgb, ${theme.vars.palette.text.primary} 30%, transparent)`
              : `var(--mui-palette-${info.color}-main)`,
          color: info.color === 'default' ? theme.vars.palette.text.primary : `var(--mui-palette-${info.color}-main)`,
          backgroundColor:
            info.color === 'default'
              ? `color-mix(in srgb, ${theme.vars.palette.text.primary} 5%, transparent)`
              : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.1)`,
          '&:hover': {
            backgroundColor:
              info.color === 'default'
                ? `color-mix(in srgb, ${theme.vars.palette.text.primary} 10%, transparent)`
                : `rgba(var(--mui-palette-${info.color}-mainChannel), 0.2)`,
          },
        })}
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
