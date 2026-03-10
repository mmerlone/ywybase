import type React from 'react'
import type { ReactElement } from 'react'
import { Container, Typography, Box } from '@mui/material'
import type { Metadata } from 'next'

import { CookieSettings } from '@/components/cookie/CookieSettings'

export const metadata: Metadata = {
  title: 'Cookie Preferences',
  description: 'Manage how we use cookies to improve your experience',
}

export default function CookiesPage(): ReactElement {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Cookie Preferences
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Manage how we use cookies to improve your experience
        </Typography>

        <CookieSettings />
      </Box>
    </Container>
  )
}
