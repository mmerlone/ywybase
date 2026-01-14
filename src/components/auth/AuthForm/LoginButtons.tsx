'use client'

import { Apple, GitHub, Google, Microsoft } from '@mui/icons-material'
import { Button, CircularProgress, Stack } from '@mui/material'
import { useState } from 'react'

import { useAuthContext } from '@/components/providers'
import { logger } from '@/lib/logger/client'
import { AuthProvidersEnum } from '@/types/auth.types'

interface LoginButtonsProps {
  disabled?: boolean
}

export function LoginButtons({ disabled = false }: LoginButtonsProps): JSX.Element {
  const { signInWithProvider, isLoading } = useAuthContext()
  const [loadingStates, setLoadingStates] = useState<Record<AuthProvidersEnum, boolean>>({
    [AuthProvidersEnum.GOOGLE]: false,
    [AuthProvidersEnum.GITHUB]: false,
    [AuthProvidersEnum.MICROSOFT]: false,
    [AuthProvidersEnum.APPLE]: false,
  })

  const handleSignIn = async (provider: AuthProvidersEnum): Promise<void> => {
    try {
      setLoadingStates((prev) => ({ ...prev, [provider]: true }))

      const { error } = await signInWithProvider(provider)
      if (error) {
        // Convert SerializableError to Error for logging
        const errorMsg = typeof error === 'string' ? error : error.message
        logger.error({ err: new Error(errorMsg), provider }, 'Login failed')
      }
    } catch (err) {
      logger.error({ err, provider }, 'Login failed')
    } finally {
      setLoadingStates((prev) => ({ ...prev, [provider]: false }))
    }
  }
  const getProviderConfig = (
    provider: AuthProvidersEnum
  ): {
    icon: JSX.Element
    text: string
    loadingText: string
    variant: 'contained' | 'outlined'
    sx?: Record<string, unknown>
  } => {
    const configs = {
      [AuthProvidersEnum.GOOGLE]: {
        icon: <Google sx={{ fontSize: 20 }} />,
        text: 'Login with Google',
        loadingText: 'Logging in...',
        variant: 'contained' as const,
        sx: {
          borderRadius: 3,
          backgroundColor: '#4285F4',
          color: 'white',
          '&:hover': {
            backgroundColor: '#3367D6',
          },
        },
      },
      [AuthProvidersEnum.GITHUB]: {
        icon: <GitHub sx={{ fontSize: 20 }} />,
        text: 'Login with GitHub',
        loadingText: 'Logging in...',
        variant: 'outlined' as const,
        sx: {
          borderRadius: 3,
        },
      },
      [AuthProvidersEnum.MICROSOFT]: {
        icon: <Microsoft sx={{ fontSize: 20 }} />,
        text: 'Login with Microsoft',
        loadingText: 'Logging in...',
        variant: 'contained' as const,
        sx: {
          borderRadius: 3,
          backgroundColor: '#00A4EF',
          color: 'white',
          '&:hover': {
            backgroundColor: '#0084C7',
          },
        },
      },
      [AuthProvidersEnum.APPLE]: {
        icon: <Apple sx={{ fontSize: 20 }} />,
        text: 'Login with Apple',
        loadingText: 'Logging in...',
        variant: 'contained' as const,
        sx: {
          borderRadius: 3,
        },
      },
    }
    return configs[provider]
  }

  return (
    <Stack
      spacing={4}
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
      }}>
      {Object.values(AuthProvidersEnum).map((provider): JSX.Element => {
        const config = getProviderConfig(provider)
        const isProviderLoading = loadingStates[provider]

        return (
          <Button
            key={provider}
            variant={config.variant}
            onClick={() => handleSignIn(provider)}
            disabled={disabled || isLoading || isProviderLoading}
            startIcon={isProviderLoading ? <CircularProgress size={20} color="inherit" /> : config.icon}
            fullWidth
            sx={config.sx}>
            {isProviderLoading ? config.loadingText : config.text}
          </Button>
        )
      })}
    </Stack>
  )
}
