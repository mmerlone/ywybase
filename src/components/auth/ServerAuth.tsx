'use client'

import React, { useCallback, useEffect, useState } from 'react'
import { Box, CircularProgress, Typography } from '@mui/material'
import type { AuthUser } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'

import { useCurrentUser } from '@/components/providers/AuthProvider'
import { logger } from '@/lib/logger/client'

interface ServerAuthProps {
  /**
   * Whether authentication is required.
   * If true, unauthenticated users will be redirected to the login page.
   * @default true
   */
  required?: boolean

  /**
   * The path to redirect to if authentication is required but user is not authenticated.
   * @default '/auth/login'
   */
  loginPath?: string

  /**
   * Content to show while checking authentication status.
   * @default A centered loading spinner
   */
  loadingComponent?: React.ReactNode

  /**
   * Content to show when user is not authenticated.
   * Only used if `required` is false.
   */
  fallback?: React.ReactNode

  /**
   * Callback function that receives the authentication state.
   * Return true to allow access, false to deny.
   * @param isAuthenticated Whether the user is authenticated
   * @param user The current user, if authenticated
   * @param session The current session, if authenticated
   */
  checkAccess?: (isAuthenticated: boolean, user: AuthUser | null, session: unknown | null) => boolean | Promise<boolean>

  /**
   * Callback when access is denied
   */
  onAccessDenied?: () => void

  /**
   * Callback when access is granted
   */
  onAccessGranted?: () => void

  /** Child components to render if authentication check passes */
  children: React.ReactNode
}

/**
 * A wrapper component that handles authentication for server components.
 * It can be used to protect routes or conditionally render content based on auth state.
 */
export function ServerAuth({
  required = true,
  loginPath = '/auth',
  loadingComponent = (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="200px">
      <CircularProgress />
      <Typography variant="body1" mt={2}>
        Checking authentication...
      </Typography>
    </Box>
  ),
  fallback = null,
  checkAccess,
  children,
  onAccessDenied,
  onAccessGranted,
}: ServerAuthProps): JSX.Element | null {
  const { user: authUser, isLoading, session } = useCurrentUser()
  const router = useRouter()
  const isAuthenticated = Boolean(authUser)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)

  const checkAccessControl = useCallback(async (): Promise<boolean> => {
    if (isLoading) return false

    // If no custom access control, just check authentication
    if (!checkAccess) return isAuthenticated || !required

    try {
      const accessResult = await checkAccess(isAuthenticated, authUser, session)
      return accessResult
    } catch (err) {
      logger.error({ err }, 'Error in access control check')
      return false
    }
  }, [isAuthenticated, isLoading, authUser, session, checkAccess, required])

  useEffect(() => {
    const verifyAccess = async (): Promise<void> => {
      // Skip if still loading
      if (isLoading) return

      const currentAccess = await checkAccessControl()
      setHasAccess(currentAccess)

      if (required && !currentAccess) {
        onAccessDenied?.()
        router.push(loginPath)
      } else if (currentAccess) {
        onAccessGranted?.()
      }
    }

    void verifyAccess().catch((err) => {
      // Log but don't throw - access check failures are handled internally
      logger.warn({ err, operation: 'verifyAccess' }, 'Failed to verify access')
    })
  }, [isAuthenticated, isLoading, router, required, loginPath, checkAccessControl, onAccessDenied, onAccessGranted])

  // If custom access control is provided, evaluate it and update local access state
  useEffect(() => {
    let mounted = true
    if (!checkAccess || isLoading) return

    const verify = async (): Promise<void> => {
      const access = await checkAccessControl()
      if (!mounted) return
      setHasAccess(access)
    }

    void verify().catch((err) => {
      // Log but don't throw - access check failures are handled internally
      logger.warn({ err, operation: 'verifyCustomAccess' }, 'Failed to verify custom access')
    })
    return (): void => {
      mounted = false
    }
  }, [checkAccess, isLoading, checkAccessControl])

  // TODO: provide a better loading UX
  // Show loading state
  if (isLoading) {
    return <>{loadingComponent}</>
  }

  // Determine if we should show the content
  const showContent = required ? isAuthenticated : true

  // Show fallback if content shouldn't be shown
  if (!showContent) {
    return <>{fallback}</>
  }

  if (checkAccess && hasAccess === false) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

/**
 * A higher-order component that wraps a component with ServerAuth
 * @param Component The component to wrap
 * @param options ServerAuth props
 * @returns A wrapped component with authentication
 */
export function withServerAuth<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ServerAuthProps, 'children'> = {}
) {
  return function WithServerAuth(props: P): JSX.Element {
    return (
      <ServerAuth {...options}>
        <Component {...props} />
      </ServerAuth>
    )
  }
}

export default ServerAuth
