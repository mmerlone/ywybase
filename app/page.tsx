import { Box } from '@mui/material'
import type { Metadata } from 'next'

import { CTASection } from '@/components/marketing/cta'
import { FeaturesSection } from '@/components/marketing/features'
import { HeroSection } from '@/components/marketing/hero'

export const metadata: Metadata = {
  title: 'Home',
  description: 'A comprehensive YwyBase for modern web applications with Next.js, TypeScript, and Material UI',
}

export default function HomePage(): JSX.Element {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Box component="section">
        <HeroSection />
      </Box>
      <Box component="section">
        <FeaturesSection />
      </Box>
      <Box component="section">
        <CTASection />
      </Box>
    </Box>
  )
}
