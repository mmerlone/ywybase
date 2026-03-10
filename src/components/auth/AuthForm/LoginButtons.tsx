'use client'

import { GitHub, Google } from '@mui/icons-material'
import { Button, CircularProgress, Stack } from '@mui/material'
import React, { useState, type ReactElement } from 'react'

import { useAuthContext } from '@/components/providers/AuthProvider'
import { logger } from '@/lib/logger/client'
import { AuthProvidersEnum, type SerializableError } from '@/types/auth.types'

interface LoginButtonsProps {
  disabled?: boolean
  onError?: (error: SerializableError) => void
  /** Called with `true` when a provider sign-in starts, `false` when it settles. */
  onLoadingChange?: (loading: boolean) => void
}

export function LoginButtons({ disabled = false, onError, onLoadingChange }: LoginButtonsProps): ReactElement {
  const { signInWithProvider, isLoading } = useAuthContext()
  const providerValues = [AuthProvidersEnum.GOOGLE, AuthProvidersEnum.GITHUB] as const
  type AvailableProvider = (typeof providerValues)[number]
  const [loadingProvider, setLoadingProvider] = useState<AvailableProvider | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)
  // Track providers that are known to be disabled to prevent retry loops
  const [disabledProviders, setDisabledProviders] = useState<Set<AvailableProvider>>(new Set())

  const handleSignIn = async (provider: AvailableProvider): Promise<void> => {
    try {
      setLoadingProvider(provider)
      onLoadingChange?.(true)

      const { error } = await signInWithProvider(provider)
      if (error) {
        const normalizedError: SerializableError =
          typeof error === 'string'
            ? {
                code: 'AUTH/UNKNOWN',
                message: error,
                isOperational: false,
                errorType: 'AppError',
              }
            : error

        if (normalizedError.code === 'AUTH/PROVIDER_DISABLED') {
          setDisabledProviders((prev) => {
            const newSet = new Set(prev)
            newSet.add(provider)
            return newSet
          })
        }

        logger.error(
          {
            err: new Error(normalizedError.message),
            provider,
            code: normalizedError.code,
          },
          'Login failed'
        )

        onError?.(normalizedError)
        // Reset loading state — stay disabled only for permanently disabled providers
        setLoadingProvider(null)
        onLoadingChange?.(false)
      } else {
        // OAuth redirect initiated successfully — keep buttons locked until navigation
        setIsRedirecting(true)
      }
    } catch (err) {
      logger.error({ err, provider }, 'Login failed')
      onError?.({
        code: 'AUTH/UNKNOWN',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        isOperational: false,
        errorType: 'AppError',
      })
      setLoadingProvider(null)
      onLoadingChange?.(false)
    }
  }
  const getProviderConfig = (
    provider: AvailableProvider
  ): {
    icon: ReactElement
    text: string
    loadingText: string
    variant: 'contained' | 'outlined'
    ariaLabel: string
    sx?: Record<string, unknown>
  } => {
    const configs: Record<
      AvailableProvider,
      {
        icon: ReactElement
        text: string
        loadingText: string
        variant: 'contained' | 'outlined'
        ariaLabel: string
        sx?: Record<string, unknown>
      }
    > = {
      [AuthProvidersEnum.GOOGLE]: {
        icon: <Google sx={{ fontSize: 20 }} />,
        text: 'Login with Google',
        loadingText: 'Logging in...',
        variant: 'contained',
        ariaLabel: 'Sign in with Google',
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
        ariaLabel: 'Sign in with GitHub',
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
      {providerValues.map((provider): ReactElement => {
        const config = getProviderConfig(provider)
        const isProviderDisabled = disabledProviders.has(provider)
        return (
          <Button
            key={provider}
            variant={config.variant}
            onClick={() => handleSignIn(provider)}
            disabled={disabled || isLoading || loadingProvider !== null || isRedirecting || isProviderDisabled}
            startIcon={loadingProvider === provider ? <CircularProgress size={20} color="inherit" /> : config.icon}
            fullWidth
            aria-label={config.ariaLabel}
            sx={config.sx}>
            {loadingProvider === provider ? config.loadingText : isProviderDisabled ? 'Not Available' : config.text}
          </Button>
        )
      })}
    </Stack>
  )
}
