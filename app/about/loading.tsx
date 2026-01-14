import { Box, Container, Grid, Paper, Skeleton } from '@mui/material'

export default function AboutLoading(): JSX.Element {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Page Title */}
        <Skeleton variant="text" width="50%" height={48} sx={{ mb: 1, mx: 'auto' }} />

        {/* Subtitle */}
        <Skeleton variant="text" width="60%" height={32} sx={{ mb: 6, mx: 'auto' }} />

        {/* Ywy Section */}
        <Box component="section" sx={{ mb: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="95%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
          </Paper>
        </Box>

        {/* Two-column layout matching AboutPage */}
        <Grid container spacing={4}>
          {/* Left Column - Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Project Overview Card */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Skeleton variant="text" width="40%" height={36} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="95%" height={20} />
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="98%" height={20} />
              </Box>
              <Box sx={{ mt: 2 }}>
                <Skeleton variant="text" width="100%" height={20} />
                <Skeleton variant="text" width="90%" height={20} />
              </Box>
            </Paper>

            {/* Key Features Card */}
            <Paper sx={{ p: 4 }}>
              <Skeleton variant="text" width="35%" height={36} sx={{ mb: 2 }} />
              <Box component="ul" sx={{ pl: 2 }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Skeleton variant="text" width="90%" height={20} />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Technology Stack Card */}
            <Paper sx={{ p: 4, mb: 4 }}>
              <Skeleton variant="text" width="70%" height={32} sx={{ mb: 3 }} />

              {/* Category Sections */}
              {Array.from({ length: 5 }).map((_, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {Array.from({ length: i === 0 ? 5 : i === 1 ? 3 : i === 2 ? 4 : i === 3 ? 3 : 3 }).map((_, j) => (
                      <Skeleton key={j} variant="rectangular" width={80} height={24} sx={{ borderRadius: 2 }} />
                    ))}
                  </Box>
                </Box>
              ))}
            </Paper>

            {/* Architecture Principles Card */}
            <Paper sx={{ p: 4 }}>
              <Skeleton variant="text" width="80%" height={32} sx={{ mb: 2 }} />
              <Box component="ul" sx={{ pl: 2 }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Box key={i} sx={{ mb: 1 }}>
                    <Skeleton variant="text" width="85%" height={18} />
                  </Box>
                ))}
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Third-Party Services Section */}
        <Paper sx={{ p: 4, mt: 4 }}>
          <Skeleton variant="text" width="50%" height={36} sx={{ mb: 1, mx: 'auto' }} />
          <Skeleton variant="text" width="70%" height={20} sx={{ mb: 4, mx: 'auto' }} />

          <Grid container spacing={3} sx={{ mt: 2 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Skeleton variant="text" width="60%" height={28} sx={{ mb: 1, mx: 'auto' }} />
                  <Skeleton variant="text" width="100%" height={16} />
                  <Skeleton variant="text" width="95%" height={16} />
                  <Skeleton variant="text" width="90%" height={16} />
                </Box>
              </Grid>
            ))}
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Skeleton variant="text" width="80%" height={16} sx={{ mx: 'auto' }} />
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
