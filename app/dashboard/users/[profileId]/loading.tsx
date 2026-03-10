import type React from 'react'
import type { ReactElement } from 'react'
import { Box, CircularProgress } from '@mui/material'

export default function UserDetailsLoading(): ReactElement {
  return (
    <Box role="status" aria-busy="true" aria-live="polite" sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
      <CircularProgress />
    </Box>
  )
}
