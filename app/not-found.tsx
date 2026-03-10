'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { SearchOff as NotFoundIcon, Home as HomeIcon, ArrowBack as BackIcon } from '@mui/icons-material'
import { Box, Container, Typography, Button, Paper } from '@mui/material'
import Link from 'next/link'

export default function NotFound(): ReactElement {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NotFoundIcon color="action" sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h4" component="h1" gutterBottom>
            Page Not Found
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Sorry, we couldn&apos;t find the page you&apos;re looking for. The page might have been moved, deleted, or
            you might have entered the wrong URL.
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<HomeIcon />} component={Link} href="/">
              Go Home
            </Button>
            <Button variant="outlined" startIcon={<BackIcon />} onClick={() => window.history.back()}>
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  )
}
