import { Skeleton } from '@mui/material'
import { Box } from '@mui/material'

export function ProfileSkeleton(): JSX.Element {
  return (
    <Box sx={{ width: '100%', p: 3 }}>
      <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto', mb: 2 }} />
      <Skeleton variant="text" sx={{ width: '60%', mx: 'auto', height: 40 }} />
      <Skeleton variant="text" sx={{ width: '40%', mx: 'auto', height: 24, mb: 4 }} />
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Skeleton variant="rectangular" width={100} height={40} />
        <Skeleton variant="rectangular" width={100} height={40} />
      </Box>
    </Box>
  )
}
