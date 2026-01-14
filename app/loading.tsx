import { Box, Container, Skeleton } from '@mui/material'

export default function Loading(): JSX.Element {
  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          py: 8,
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
          alignItems: 'center',
        }}>
        {/* Page Title */}
        <Skeleton variant="text" width="40%" height={56} />

        {/* Page Subtitle */}
        <Skeleton variant="text" width="60%" height={28} />

        {/* Content Cards */}
        <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, mt: 4 }}>
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
          <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 2 }} />
        </Box>
      </Box>
    </Container>
  )
}
