'use client'

import { Box, Skeleton, Grid, Paper, Stack } from '@mui/material'

/** Number of stat card skeletons to display in the loading state */
const STAT_CARDS_COUNT = 4

/** Number of activity item skeletons to display in the loading state */
const ACTIVITY_ITEMS_COUNT = 4

export default function DashboardLoading(): JSX.Element {
  return (
    <Box role="status" aria-busy="true" aria-live="polite">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Skeleton variant="text" width="200px" sx={{ mb: 1, fontSize: '2.5rem' }} />
          <Skeleton variant="text" width="300px" />
        </Box>
        <Stack direction="row" spacing={2}>
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={140} height={40} sx={{ borderRadius: 1 }} />
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {Array.from({ length: STAT_CARDS_COUNT }, (_, i) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={i}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ flexGrow: 1 }}>
                  <Skeleton variant="text" width="60%" />
                  <Skeleton variant="text" width="80%" height={48} />
                </Box>
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
              <Skeleton variant="text" width="40%" />
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, borderRadius: 2, height: '100%' }}>
            <Skeleton variant="text" width="40%" sx={{ mb: 3 }} />
            <Stack spacing={2}>
              {Array.from({ length: ACTIVITY_ITEMS_COUNT }, (_, i) => (
                <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
              ))}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
