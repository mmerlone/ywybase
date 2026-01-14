import { Box, Container, Skeleton } from '@mui/material'

export default function ErrorLoading(): JSX.Element {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        }}>
        {/* Error Icon Placeholder */}
        <Skeleton variant="circular" width={80} height={80} />

        {/* Error Title */}
        <Skeleton variant="text" width="60%" height={48} />

        {/* Error Message */}
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="70%" height={24} />

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={120} height={40} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Container>
  )
}
