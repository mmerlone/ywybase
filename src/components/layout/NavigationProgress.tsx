'use client'

import React, { useTransition, type ReactElement } from 'react'
import { LinearProgress, Box } from '@mui/material'

/**
 * Navigation progress indicator for client-side route transitions.
 * Shows a linear progress bar at the top of the page during React transitions.
 *
 * This complements Next.js loading.tsx files by providing feedback
 * during client-side navigation when loading.tsx isn't triggered.
 *
 * Note: This component shows progress during useTransition() calls.
 * For more comprehensive navigation tracking, consider using a library
 * like nprogress.
 */
export function NavigationProgress(): ReactElement | null {
  const [isPending] = useTransition()

  if (!isPending) return null

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: (theme) => theme.zIndex.appBar + 1,
      }}>
      <LinearProgress />
    </Box>
  )
}
