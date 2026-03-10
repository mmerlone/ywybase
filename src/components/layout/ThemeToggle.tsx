'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { DarkMode, LightMode, SettingsBrightness } from '@mui/icons-material'
import { Skeleton, ToggleButton, ToggleButtonGroup } from '@mui/material'
import { useColorScheme } from '@mui/material/styles'

import { type ThemePreference, ThemePreferenceEnum } from '@/types/theme.types'
import { useAuthContext } from '../providers/AuthProvider'
import { useProfile } from '@/hooks/useProfile'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('ThemeToggle')

export function ThemeToggle(): ReactElement {
  const { mode, setMode } = useColorScheme()
  const { authUser } = useAuthContext()
  const { updateThemePreference } = useProfile(authUser?.id)

  const handleThemeChange = async (_event: React.MouseEvent<HTMLElement>, newTheme: string | null): Promise<void> => {
    if (newTheme !== null) {
      const selectedTheme = newTheme as ThemePreference
      setMode(selectedTheme)

      // Persist to database if user is logged in
      if (authUser?.id) {
        try {
          await updateThemePreference(selectedTheme)
        } catch (error) {
          // Error is already logged in useProfile/updateThemePreference
          logger.error({ error, selectedTheme }, 'Failed to persist theme preference')
        }
      }
    }
  }

  const themeOptions = [
    {
      value: ThemePreferenceEnum.LIGHT,
      label: 'Light',
      icon: <LightMode fontSize="small" />,
      ariaLabel: 'Switch to light theme',
    },
    {
      value: ThemePreferenceEnum.SYSTEM,
      label: 'System',
      icon: <SettingsBrightness fontSize="small" />,
      ariaLabel: 'Use system theme',
    },
    {
      value: ThemePreferenceEnum.DARK,
      label: 'Dark',
      icon: <DarkMode fontSize="small" />,
      ariaLabel: 'Switch to dark theme',
    },
  ]

  // Show skeleton while theme mode is loading
  if (!mode) {
    return <Skeleton variant="rectangular" width={106} height={36} sx={{ borderRadius: 1 }} />
  }

  return (
    <ToggleButtonGroup
      value={mode ?? ThemePreferenceEnum.SYSTEM}
      exclusive
      onChange={handleThemeChange}
      aria-label="theme selection"
      size="small"
      sx={{
        '& .MuiToggleButton-root': {
          color: 'text.secondary',
          borderColor: 'divider',
          '&.Mui-selected': {
            color: 'primary.main',
            backgroundColor: 'action.selected',
            '&:hover': {
              backgroundColor: 'action.hover',
            },
          },
          '&:hover': {
            backgroundColor: 'action.hover',
          },
        },
      }}>
      {themeOptions.map((option) => (
        <ToggleButton key={option.value} value={option.value} aria-label={option.ariaLabel}>
          {option.icon}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  )
}
