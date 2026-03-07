'use client'

import { Chip, type ChipProps } from '@mui/material'
import {
  CheckCircle as ActiveIcon,
  Block as SuspendedIcon,
  AccessTime as PendingIcon,
  RemoveCircleOutline as InactiveIcon,
  HelpOutline as UnknownIcon,
} from '@mui/icons-material'
import { type Profile, UserStatusEnum } from '@/types/profile.types'

/**
 * Props for UserStatusBadge component.
 */
interface UserStatusBadgeProps {
  /** The user's current status from their profile */
  status: Profile['status']
}

/**
 * Displays a colored chip badge indicating the user's account status.
 *
 * Status colors:
 * - Active: green (success)
 * - Inactive: grey (default)
 * - Suspended: red (error)
 * - Pending: orange (warning)
 *
 * @param props - Component props containing the user status
 * @returns A styled Chip component showing the status
 */
export function UserStatusBadge({ status }: UserStatusBadgeProps): JSX.Element {
  const getStatusInfo = (): { color: ChipProps['color']; icon: JSX.Element; label: string } => {
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

  const info = getStatusInfo()

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
