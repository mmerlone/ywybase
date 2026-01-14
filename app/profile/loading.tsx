import { Box, Container, Grid, Paper, Skeleton } from '@mui/material'

export default function ProfileLoading(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page subtitle (no h4 title in actual page) */}
      <Skeleton variant="text" width="50%" height={24} sx={{ mb: 2 }} />

      {/* Grid layout matching ProfileForm */}
      <Box sx={{ mt: 1, width: '100%' }}>
        <Grid container spacing={3}>
          {/* Left Column - Avatar Section (sticky sidebar) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <Skeleton variant="circular" width={120} height={120} />
                <Skeleton variant="text" width={140} height={24} />
                <Skeleton variant="rectangular" width={160} height={40} sx={{ borderRadius: 1 }} />
              </Box>
            </Paper>
          </Grid>

          {/* Right Column - Tabbed Form (single Paper with tabs) */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 4 }}>
              {/* Tabs */}
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Box sx={{ display: 'flex', gap: 3 }}>
                  <Skeleton variant="text" width={80} height={40} />
                  <Skeleton variant="text" width={80} height={40} />
                </Box>
              </Box>

              {/* Account Details Section */}
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width={150} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>

              {/* Personal Info Section */}
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Box>
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>

              {/* Contact Info Section */}
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width={160} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>

              {/* Location Info Section */}
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width={170} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>

              {/* Professional Info Section */}
              <Box sx={{ mb: 4 }}>
                <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} />
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                  <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
                </Box>
              </Box>

              {/* Form action buttons */}
              <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 4 }}>
                <Skeleton variant="rectangular" width="100%" height={42} sx={{ borderRadius: 1, maxWidth: 200 }} />
                <Skeleton variant="rectangular" width="100%" height={42} sx={{ borderRadius: 1, maxWidth: 200 }} />
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  )
}
