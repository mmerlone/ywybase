import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Grid, Paper, Skeleton, Stack } from '@mui/material'

/**
 * Unified skeleton for the entire profile page.
 * Matches the layout structure of ProfileForm (4/8 column split).
 */
export function ProfileSkeleton(): ReactElement {
  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Grid container spacing={3}>
        {/* Left Column Skeleton */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3} alignItems="center">
              <Skeleton variant="circular" width={180} height={180} />
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} />
              <Stack direction="row" spacing={1}>
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
              </Stack>
              <Box sx={{ width: '100%', mt: 2 }}>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="80%" height={20} />
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Column Skeleton */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Stack direction="row" spacing={2}>
                <Skeleton variant="rectangular" width={80} height={40} />
                <Skeleton variant="rectangular" width={80} height={40} />
                <Skeleton variant="rectangular" width={80} height={40} />
              </Stack>
            </Box>
            <Stack spacing={4}>
              <Box>
                <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>
              </Box>
              <Box>
                <Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Skeleton variant="rectangular" width="100%" height={56} sx={{ borderRadius: 1 }} />
                  </Grid>
                </Grid>
              </Box>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
