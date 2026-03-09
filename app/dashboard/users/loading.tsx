'use client'

import React from 'react'
import { Box, Skeleton, Paper, Stack } from '@mui/material'

export default function UsersLoading(): JSX.Element {
  return (
    <Box role="status" aria-busy="true" aria-live="polite">
      <Box sx={{ mb: 4 }}>
        <Skeleton variant="text" width="200px" sx={{ mb: 2 }} />
        <Skeleton variant="text" sx={{ fontSize: '2.5rem', width: '300px', mb: 1 }} />
        <Skeleton variant="text" sx={{ width: '400px' }} />
      </Box>

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
          <Skeleton variant="rectangular" sx={{ flexGrow: 1, height: 40, borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={100} height={40} sx={{ borderRadius: 1 }} />
        </Stack>
      </Paper>

      <Paper sx={{ borderRadius: 2 }}>
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" spacing={2}>
            {[1, 2, 3, 4, 5].map(
              (i): JSX.Element => (
                <Skeleton key={i} variant="text" sx={{ flexGrow: 1 }} />
              )
            )}
          </Stack>
        </Box>
        {[1, 2, 3, 4, 5].map(
          (i): JSX.Element => (
            <Box key={i} sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton variant="text" sx={{ flexGrow: 2 }} />
                <Skeleton variant="text" sx={{ flexGrow: 1 }} />
                <Skeleton variant="text" sx={{ flexGrow: 1 }} />
                <Skeleton variant="circular" width={24} height={24} />
              </Stack>
            </Box>
          )
        )}
      </Paper>
    </Box>
  )
}
