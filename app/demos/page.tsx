'use client'

import React, { type ReactElement } from 'react'
import { Box, Typography, Card, CardContent, CardActions, Button, Stack } from '@mui/material'
import Link from 'next/link'

export default function DemosPage(): ReactElement {
  return (
    <Box sx={{ p: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Component Demos
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Interactive demos and testing pages for various components and features.
      </Typography>

      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Sentry Error Testing
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Test error reporting and monitoring by triggering various types of errors to verify Sentry integration.
            </Typography>
          </CardContent>
          <CardActions>
            <Button component={Link} href="/demos/sentry" variant="contained">
              Open Demo
            </Button>
          </CardActions>
        </Card>

        {/* Add more demo cards here as needed */}
      </Stack>
    </Box>
  )
}
