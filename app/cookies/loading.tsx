'use client'

import { Container, Box, Paper, Skeleton, Divider } from '@mui/material'

export default function CookiesLoading(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Skeleton variant="text" height={56} sx={{ mb: 2 }} />
        <Skeleton variant="text" height={24} sx={{ mb: 4, width: '60%', mx: 'auto' }} />

        <Paper sx={{ p: 4 }}>
          <Skeleton variant="text" height={32} sx={{ mb: 3 }} />
          <Skeleton variant="text" height={20} sx={{ mb: 3 }} />

          <Divider sx={{ my: 3 }} />

          <Skeleton variant="text" height={28} sx={{ mb: 2 }} />
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ mb: 2 }}>
              <Skeleton variant="text" height={20} />
              <Skeleton variant="text" height={16} sx={{ mt: 0.5 }} />
              <Skeleton variant="text" height={16} width="80%" />
            </Box>
          ))}

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Skeleton variant="rectangular" width={120} height={36} />
            <Skeleton variant="rectangular" width={140} height={36} />
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
