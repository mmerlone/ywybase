import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Container, Paper, Skeleton } from '@mui/material'

export default function AuthLoading(): ReactElement {
  return (
    <Container maxWidth="md">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          py: 8,
        }}>
        {/* Welcome Title */}
        <Skeleton variant="text" width="60%" height={56} sx={{ mb: 6 }} />

        {/* Auth Form Card */}
        <Paper sx={{ p: 4, width: '100%', maxWidth: 440 }}>
          {/* Form Title */}
          <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3, mx: 'auto' }} />

          {/* Email Field */}
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />

          {/* Password Field */}
          <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 1 }} />

          {/* Submit Button */}
          <Skeleton variant="rectangular" height={42} sx={{ mt: 3, mb: 2, borderRadius: 1 }} />

          {/* Divider */}
          <Box sx={{ display: 'flex', alignItems: 'center', my: 3 }}>
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
            <Skeleton variant="text" width={40} sx={{ mx: 2 }} />
            <Box sx={{ flex: 1, height: 1, bgcolor: 'divider' }} />
          </Box>

          {/* OAuth Buttons */}
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={40} sx={{ mb: 1, borderRadius: 1 }} />
          ))}

          {/* Footer Links */}
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Skeleton variant="text" width={120} height={20} />
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
