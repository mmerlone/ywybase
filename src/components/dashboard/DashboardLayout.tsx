'use client'

import React, { type ReactElement } from 'react'
import { Box } from '@mui/material'

interface DashboardLayoutClientProps {
  children: React.ReactNode
}

export function DashboardLayoutClient({ children }: DashboardLayoutClientProps): ReactElement {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 120px)',
        p: { xs: 2, md: 4 },
        bgcolor: 'background.default',
      }}>
      {children}
    </Box>
  )
}
