import type { ReactElement } from 'react'
import { Box } from '@mui/material'
import type { Metadata } from 'next'

import { CTASection } from '@/components/marketing/cta/CTASection'
import { FeaturesSection } from '@/components/marketing/features/FeaturesSection'
import { HeroSection } from '@/components/marketing/hero/HeroSection'
import { MotivationSection } from '@/components/marketing/motivation/MotivationSection'
import { ValuePropsSection } from '@/components/marketing/value-props/ValuePropsSection'

export const metadata: Metadata = {
  title: 'YwyBase | Solid Ground to Scale',
  description:
    'A richer overview of YwyBase: a production-ready Next.js foundation with clean architecture, authentication, security, theming, and developer-focused defaults.',
}

export default function HomePage(): ReactElement {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <HeroSection />
      <ValuePropsSection />
      <FeaturesSection />
      <MotivationSection />
      <CTASection />
    </Box>
  )
}
