import type React from 'react'
import type { ReactElement } from 'react'
import { AppBar, Box, Skeleton, Toolbar } from '@mui/material'

import { SITE_CONFIG } from '@/config/site'

export function HeaderSkeleton(): ReactElement {
  return (
    <AppBar position={SITE_CONFIG.layout.fixedHeader ? 'sticky' : 'static'} elevation={2}>
      <Toolbar>
        {/* Logo skeleton */}
        <Skeleton variant="circular" width={40} height={40} sx={{ mr: 2 }} />

        {/* Title skeleton */}
        <Skeleton variant="text" width={120} height={32} sx={{ flexGrow: 1 }} />

        {/* Navigation buttons skeleton */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={80} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={106} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={205} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      </Toolbar>
    </AppBar>
  )
}
