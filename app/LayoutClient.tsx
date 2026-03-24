'use client'

import { Alert, Box, useTheme } from '@mui/material'
import Link from 'next/link'
import React, { type ReactNode, type ReactElement } from 'react'

import { CookieBanner } from '@/components/cookie/CookieBanner'
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'
import { Footer } from '@/components/layout/Footer'
import { Header } from '@/components/layout/Header'
import { NavigationProgress } from '@/components/layout/NavigationProgress'
import { PageBreadcrumbs } from '@/components/layout/PageBreadcrumbs'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { FlashMessageHandler } from '@/components/providers/FlashMessageHandler'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { SnackbarProvider } from '@/contexts/SnackbarContext'
import { SITE_CONFIG } from '@/config/site'
import type { SupabaseEnvStatus } from '@/config/supabase-public'
import type { FlashMessage } from '@/lib/utils/flash-messages.client'

interface LayoutClientProps {
  children: ReactNode
  supabaseStatus: SupabaseEnvStatus
  isDev: boolean
  initialFlash?: FlashMessage | null
}

function MainContent({
  children,
  supabaseEnabled,
  isDev,
}: {
  children: ReactNode
  supabaseEnabled: boolean
  isDev: boolean
}): ReactElement {
  const theme = useTheme()
  return (
    <Box
      component="main"
      sx={{
        flex: 1,
        pt: 'var(--header-height)',
        pb: 3,
        transition: theme.transitions.create('padding', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.leavingScreen,
        }),
      }}>
      {!supabaseEnabled && isDev && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Supabase configuration is missing; authentication and profile features are disabled until the required
          environment variables are set. See the setup guide in the README.
          {` `}
          <Link href={`${SITE_CONFIG.github}#-quick-start`} target="_blank" rel="noreferrer">
            View instructions
          </Link>
        </Alert>
      )}
      <PageBreadcrumbs />
      {children}
    </Box>
  )
}

export function LayoutClient({ children, supabaseStatus, isDev, initialFlash }: LayoutClientProps): ReactElement {
  const supabaseEnabled = supabaseStatus.isConfigured
  const theme = useTheme()
  const isFixed = SITE_CONFIG.layout.fixedHeader
  const headerHeight = isFixed ? theme.mixins.toolbar.minHeight : 0

  const appShell = (
    <GlobalErrorBoundary>
      <ThemeProvider>
        <SnackbarProvider>
          <NavigationProgress />
          <FlashMessageHandler initialFlash={initialFlash} />
          <Box
            id="layout-client-container"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
              '--header-height': `${headerHeight}px`,
            }}>
            <Header supabaseEnabled={supabaseEnabled} />
            <MainContent supabaseEnabled={supabaseEnabled} isDev={isDev}>
              {children}
            </MainContent>
            <Footer />
            <CookieBanner />
          </Box>
        </SnackbarProvider>
      </ThemeProvider>
    </GlobalErrorBoundary>
  )

  return <QueryProvider>{supabaseEnabled ? <AuthProvider>{appShell}</AuthProvider> : appShell}</QueryProvider>
}
