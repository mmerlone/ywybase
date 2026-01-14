import { Box, Skeleton } from '@mui/material'

interface FormFieldSkeletonProps {
  fullWidth?: boolean
  height?: number
}

export function FormFieldSkeleton({ fullWidth = true, height = 56 }: FormFieldSkeletonProps): JSX.Element {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Skeleton variant="rectangular" height={height} sx={{ borderRadius: 1 }} />
    </Box>
  )
}
