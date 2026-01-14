'use client'

import { Box, useTheme } from '@mui/material'
import { ReactNode } from 'react'

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

export function LayoutClient({ children }: { children: ReactNode }): JSX.Element {
  const theme = useTheme()

  return (
    <QueryProvider>
      <AuthProvider>
        <GlobalErrorBoundary>
          <ThemeProvider>
            <SnackbarProvider>
              <NavigationProgress />
              <FlashMessageHandler />
              <Box id="layout-client-container" sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                <Header />
                <Box
                  component="main"
                  sx={{
                    flex: 1,
                    // pt: '56px',
                    pb: 3,
                    transition: theme.transitions.create('padding', {
                      easing: theme.transitions.easing.sharp,
                      duration: theme.transitions.duration.leavingScreen,
                    }),
                  }}>
                  <PageBreadcrumbs />
                  {children}
                </Box>
                <Footer />
                <CookieBanner />
              </Box>
            </SnackbarProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
      </AuthProvider>
    </QueryProvider>
  )
}
