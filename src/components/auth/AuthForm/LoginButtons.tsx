'use client'

import { GitHub, Google } from '@mui/icons-material'
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
  // Only support Google and GitHub providers
  const providerValues = [AuthProvidersEnum.GOOGLE, AuthProvidersEnum.GITHUB]
  const initialLoadingStates = {
    [AuthProvidersEnum.GOOGLE]: false,
    [AuthProvidersEnum.GITHUB]: false,
  }
  const [loadingStates, setLoadingStates] = useState<Record<AuthProvidersEnum, boolean>>(initialLoadingStates)

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
    const configs: Record<
      AuthProvidersEnum,
      {
        icon: JSX.Element
        text: string
        loadingText: string
        variant: 'contained' | 'outlined'
        sx?: Record<string, unknown>
      }
    > = {
      [AuthProvidersEnum.GOOGLE]: {
        icon: <Google sx={{ fontSize: 20 }} />,
        text: 'Login with Google',
        loadingText: 'Logging in...',
        variant: 'contained',
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
        variant: 'outlined',
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
      {providerValues.map((provider): JSX.Element => {
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
