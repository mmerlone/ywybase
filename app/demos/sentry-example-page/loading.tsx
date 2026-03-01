import { Box, Container, Paper, Skeleton } from '@mui/material'

export default function SentryExampleLoading(): JSX.Element {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Header */}
      <Skeleton variant="text" width="40%" height={48} sx={{ mb: 2 }} />
      <Skeleton variant="text" width="60%" height={24} sx={{ mb: 4 }} />

      {/* Button Grid */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
          gap: 2,
          mb: 4,
        }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <Paper key={i} sx={{ p: 3 }}>
            <Skeleton variant="text" width="70%" height={28} sx={{ mb: 1 }} />
            <Skeleton variant="text" width="90%" height={20} />
            <Skeleton variant="text" width="85%" height={20} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" width="100%" height={40} sx={{ borderRadius: 1 }} />
          </Paper>
        ))}
      </Box>
    </Container>
  )
}
