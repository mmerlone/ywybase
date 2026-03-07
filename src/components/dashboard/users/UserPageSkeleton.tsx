import { Box, Grid, Paper, Skeleton, Stack, Divider } from '@mui/material'

export function UserPageSkeleton(): JSX.Element {
  return (
    <Box>
      <Paper sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
        <Stack spacing={5}>
          {/* Header */}
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={40} height={40} />
            <Box>
              <Skeleton variant="text" width={200} height={40} sx={{ fontWeight: 800 }} />
              <Skeleton variant="text" width={320} height={20} />
            </Box>
          </Stack>

          <Grid container spacing={4}>
            {/* User Main Data Skeleton */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Paper
                sx={{
                  p: 3,
                  borderRadius: 2,
                  height: '100%',
                  border: '1px solid',
                  borderColor: 'divider',
                  boxShadow: 0,
                }}>
                <Stack spacing={3}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Skeleton variant="circular" width={72} height={72} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="80%" height={28} />
                      <Skeleton variant="text" width="60%" height={20} />
                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                        <Skeleton variant="rectangular" width={60} height={24} sx={{ borderRadius: 1 }} />
                      </Stack>
                    </Box>
                  </Stack>

                  <Divider />

                  <Box>
                    <Skeleton variant="text" width={80} height={20} sx={{ mb: 1.5 }} />
                    <Stack direction="row" spacing={1}>
                      <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
                      <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 2 }} />
                    </Stack>
                  </Box>

                  <Divider />

                  <Stack spacing={1.5}>
                    <Skeleton variant="text" width={80} height={20} />
                    {[1, 2, 3].map((i) => (
                      <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton variant="text" width={100} height={20} />
                        <Skeleton variant="text" width={100} height={20} />
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Grid>

            {/* User Profile Data Skeleton */}
            <Grid size={{ xs: 12, md: 8 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
                <Stack spacing={4}>
                  <Box>
                    <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                    <Grid container spacing={2}>
                      {[1, 2, 3].map((i) => (
                        <Grid size={{ xs: 12, md: 6 }} key={i}>
                          <Skeleton variant="text" width={80} height={20} />
                          <Skeleton variant="text" width="90%" height={24} />
                        </Grid>
                      ))}
                    </Grid>
                  </Box>

                  {[1, 2, 3].map((s) => (
                    <Box key={s}>
                      <Divider sx={{ mb: 4 }} />
                      <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                      <Grid container spacing={2}>
                        {[1, 2, 3, 4].map((f) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={f}>
                            <Skeleton variant="text" width={100} height={20} />
                            <Skeleton variant="text" width="80%" height={24} />
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  ))}
                </Stack>
              </Paper>
            </Grid>
          </Grid>

          <Divider />

          {/* Bottom Sections Skeleton */}
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
                <Skeleton variant="text" width={200} height={28} sx={{ mb: 3 }} />
                <Stack direction="row" spacing={2}>
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
                </Stack>
              </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
                <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                <Stack spacing={2}>
                  <Skeleton variant="text" width="100%" height={32} />
                  <Box>
                    <Skeleton variant="text" width={100} height={20} sx={{ mb: 1 }} />
                    <Stack direction="row" spacing={2}>
                      <Skeleton variant="text" width={80} height={20} />
                      <Skeleton variant="text" width={80} height={20} />
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          </Grid>
        </Stack>
      </Paper>
    </Box>
  )
}
