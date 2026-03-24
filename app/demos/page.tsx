import type { ReactElement } from 'react'
import type { Metadata } from 'next'
import { Box, Typography, Stack } from '@mui/material'
import { DemoCard, type Demo } from '@/components/marketing/demos/DemoCard'

export const metadata: Metadata = {
  title: 'Component Demos',
  description: 'Interactive demos and testing pages for various components and features.',
}

const DEMOS: Demo[] = [
  {
    title: 'mui7-phone-number',
    description:
      'Interactive phone number input demos for the MUI 7 compatible country picker, formatting, validation, and localization behaviors.',
    href: '/demos/mui7-phone-number',
  },
  {
    title: 'react-tz-globepicker',
    description:
      'Interactive 3D globe component for selecting timezones with beautiful visualizations, markers, and customizable styling.',
    href: '/demos/react-tz-globepicker',
  },
  {
    title: 'Sentry Error Testing',
    description:
      'Test error reporting and monitoring by triggering various types of errors to verify Sentry integration.',
    href: '/demos/sentry',
  },
]

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
        {DEMOS.map((demo) => (
          <DemoCard key={demo.href} demo={demo} />
        ))}
      </Stack>
    </Box>
  )
}
