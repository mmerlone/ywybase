'use client'

import type { ReactElement } from 'react'
import { Code, Palette, Security, Speed, Storage, Visibility } from '@mui/icons-material'
import { Container, Grid } from '@mui/material'

import { SectionHeading } from '@/components/marketing/shared/SectionHeading'

import { FeatureCard, type Feature } from './FeatureCard'

const features: readonly Feature[] = [
  {
    icon: <Security />,
    title: 'Clean architecture that stays readable',
    description:
      'Components, hooks, server actions, and database operations each have a clear job. It is easier to onboard contributors, test behavior, and change direction without unraveling the app.',
    isHighlighted: true,
  },
  {
    icon: <Security />,
    title: 'Authentication flows already handled',
    description:
      'Supabase-powered sign up, login, verification, recovery, route protection, and session management are already in place so product work can start sooner.',
  },
  {
    icon: <Palette />,
    title: 'Design system ready, not design locked',
    description:
      'Material UI 7, theme switching, light and dark mode, Tailwind utilities, and accessible UI patterns give teams a strong baseline that still leaves room for brand expression.',
    isHighlighted: true,
  },
  {
    icon: <Storage />,
    title: 'Forms and data with less ceremony',
    description:
      'React Hook Form, Zod validation, React Query, and typed Supabase flows reduce repetitive setup while keeping client and server state predictable.',
  },
  {
    icon: <Visibility />,
    title: 'Operational visibility built in',
    description:
      'Centralized error handling, structured Pino logs, Sentry monitoring, and safe server patterns help teams catch issues early instead of after trust is lost.',
  },
  {
    icon: <Code />,
    title: 'Developer experience that protects momentum',
    description:
      'TypeScript strict mode, ESLint, Prettier, Husky, and documented project conventions keep the repo healthier when time is tight and collaborators multiply.',
    isHighlighted: true,
  },
  {
    icon: <Speed />,
    title: 'Secure defaults, not security theater',
    description:
      'RLS, CSRF protection, secure cookies, rate limiting, consent tooling, and hardened headers help the app begin in a more trustworthy place.',
  },
]

export function FeaturesSection(): ReactElement {
  return (
    <Container component="section" maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
      <SectionHeading
        eyebrow="What is inside"
        title="The foundation covers the parts that usually slow teams down."
        description="Every section here maps back to something the project already values in the README and codebase: clarity, type safety, secure defaults, accessible UI, and a developer experience that encourages steady iteration."
      />

      <Grid container spacing={3}>
        {features.map((feature) => (
          <Grid
            key={feature.title}
            size={{
              xs: 12,
              md: 6,
            }}
            sx={{
              display: 'flex',
              '& > *': {
                width: '100%',
              },
            }}>
            <FeatureCard feature={feature} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
