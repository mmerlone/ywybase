'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { Chip, type SxProps, type Theme } from '@mui/material'
import { Google, GitHub, Email, Cloud } from '@mui/icons-material'
import { AuthProvidersEnum } from '@/types/auth.types'

interface ProviderBadgeProps {
  provider: string
}

export function ProviderBadge({ provider }: ProviderBadgeProps): ReactElement {
  const getProviderConfig = (providerName: string): { icon: ReactElement; label: string; sx: SxProps<Theme> } => {
    const p = providerName.toLowerCase()
    switch (p) {
      case 'google':
      case AuthProvidersEnum.GOOGLE:
        return {
          icon: <Google style={{ fontSize: 16 }} />,
          label: 'Google',
          sx: {
            bgcolor: '#4285F4',
            color: '#fff',
            '& .MuiChip-icon': { color: '#fff' },
          },
        }
      case 'github':
      case AuthProvidersEnum.GITHUB:
        return {
          icon: <GitHub style={{ fontSize: 16 }} />,
          label: 'GitHub',
          sx: {
            bgcolor: '#24292e',
            color: '#fff',
            '& .MuiChip-icon': { color: '#fff' },
          },
        }
      case 'email':
      case 'password':
        return {
          icon: <Email style={{ fontSize: 16 }} />,
          label: 'Email',
          sx: {
            bgcolor: 'action.selected',
            color: 'text.primary',
            border: '1px solid',
            borderColor: 'divider',
          },
        }
      default:
        return {
          icon: <Cloud style={{ fontSize: 16 }} />,
          label: p.charAt(0).toUpperCase() + p.slice(1),
          sx: {
            bgcolor: 'action.hover',
          },
        }
    }
  }

  const config = getProviderConfig(provider)

  return (
    <Chip
      icon={config.icon}
      label={config.label}
      size="medium"
      sx={{
        fontWeight: 600,
        ...config.sx,
      }}
    />
  )
}
