import { Box, Container, Paper, Skeleton } from '@mui/material'

export default function PrivacyLoading(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        {/* Page Title */}
        <Skeleton variant="text" width="60%" height={48} sx={{ mb: 1, mx: 'auto' }} />

        {/* Subtitle */}
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 4, mx: 'auto' }} />

        {/* Content Paper */}
        <Paper sx={{ p: 4 }}>
          {/* Section Title */}
          <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} />

          {/* Paragraph Lines */}
          <Box sx={{ mb: 3 }}>
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="100%" height={20} />
            <Skeleton variant="text" width="95%" height={20} />
            <Skeleton variant="text" width="98%" height={20} />
          </Box>

          {/* Repeat for multiple sections */}
          {Array.from({ length: 4 }).map((_, i) => (
            <Box key={i} sx={{ mb: 3 }}>
              <Skeleton variant="text" width="45%" height={32} sx={{ mb: 2 }} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="100%" height={20} />
              <Skeleton variant="text" width="92%" height={20} />
            </Box>
          ))}
        </Paper>
      </Box>
    </Container>
  )
}
