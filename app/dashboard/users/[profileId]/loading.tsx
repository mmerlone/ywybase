import { Box, CircularProgress } from '@mui/material'

export default function UserDetailsLoading(): JSX.Element {
  return (
    <Box role="status" aria-busy="true" aria-live="polite" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  )
}
