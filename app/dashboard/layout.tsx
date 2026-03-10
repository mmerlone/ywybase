import type React from 'react'
import type { ReactElement } from 'react'
import { requireAdmin } from '@/lib/auth/guards'
import { DashboardLayoutClient } from '@/components/dashboard/DashboardLayout'
import { Box, Container } from '@mui/material'

export default async function DashboardLayout({ children }: { children: React.ReactNode }): Promise<ReactElement> {
  // Guard: requires admin or root role, redirects to auth if not authenticated
  await requireAdmin()

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <DashboardLayoutClient>
        <Container maxWidth="xl">{children}</Container>
      </DashboardLayoutClient>
    </Box>
  )
}
