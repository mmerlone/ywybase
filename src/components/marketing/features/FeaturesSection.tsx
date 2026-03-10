import type React from 'react'
import type { ReactElement } from 'react'
import { Article, Code, FlashOn, Memory, Palette, Security, Star, Storage, VerifiedUser } from '@mui/icons-material'
import { Container, Grid, Typography } from '@mui/material'

import { FeatureCard, type Feature } from './FeatureCard'

const features: Feature[] = [
  {
    icon: <Security />,
    title: 'Advanced Security',
    description:
      'Comprehensive security: RLS, CSRF, secure cookies, rate limiting, and best-practice headers. Built-in protection against common web threats.',
    span: 2,
    isHighlighted: true,
  },
  {
    icon: <Palette />,
    title: 'Fully Themeable UI',
    description:
      'Dynamic theme switching, Material UI v7, custom theme registry, and light/dark mode for easy extensibility.',
  },
  {
    icon: <FlashOn />,
    title: 'UX & DX Focus',
    description:
      'Designed for both end-user experience and developer productivity. Fast, accessible, and delightful to use and build.',
    span: 2,
    isHighlighted: true,
  },
  {
    icon: <Star />,
    title: 'Production-Ready Foundation',
    description:
      'A complete, battle-tested starting point for any project with built-in best practices, error handling, and developer tooling.',
    span: 2,
    isHighlighted: true,
  },
  {
    icon: <Security />,
    title: 'Robust Error Handling',
    description:
      'Centralized error system with Sentry integration, structured logging, and safe error boundaries for both client and server.',
  },
  {
    icon: <Security />,
    title: 'Advanced Authentication',
    description:
      'Secure authentication with Supabase, including OAuth providers, email/password, magic links, and 2FA support.',
  },
  {
    icon: <Storage />,
    title: 'Supabase-Powered Backend',
    description:
      "Leverage Supabase's powerful backend services including authentication, real-time database, and storage. Built with security and scalability in mind.",
    span: 2,
    isHighlighted: true,
  },
  {
    icon: <VerifiedUser />,
    title: 'GDPR Compliant Cookies',
    description:
      'Privacy-first cookie management with vanilla-cookieconsent, ensuring GDPR/CCPA compliance with granular user consent controls.',
    isHighlighted: true,
    span: 2,
  },
  {
    icon: <Palette />,
    title: 'Material-UI v7',
    description:
      'Beautiful, responsive UI components following Material Design principles with full theming support and dark mode.',
  },
  {
    icon: <FlashOn />,
    title: 'App Router Ready',
    description: 'Leveraging Next.js 14+ App Router with React Server Components, streaming, and partial rendering.',
  },
  {
    icon: <Article />,
    title: 'Flexible Logging',
    description:
      'Comprehensive logging system supporting multiple providers (pino, Sentry) with structured logging and configurable log levels.',
    span: 2,
    isHighlighted: true,
  },
  {
    icon: <Memory />,
    title: 'Optimized Performance',
    description: 'Automatic code splitting, image optimization, and efficient data fetching with React Query v5.',
  },
  {
    icon: <Code />,
    title: 'TypeScript 5.0+',
    description:
      'Strict type checking, latest TypeScript features, and full type safety across the entire application.',
  },
  {
    icon: <FlashOn />,
    title: 'Server Actions',
    description: 'Next.js Server Actions for secure server-side data mutations without API routes.',
  },
  {
    icon: <Code />,
    title: 'Developer Experience',
    description: 'Pre-configured with ESLint, Prettier, Husky, and commitlint for consistent code quality.',
    span: 2,
  },
  {
    icon: <Memory />,
    title: 'Edge & Middleware',
    description: 'Edge runtime support and middleware for global logic, authentication, and more.',
  },
]

const getGridSize = (span?: number): number => {
  switch (span) {
    case 1:
      return 4 // 1/3 width (4/12)
    case 2:
      return 8 // 2/3 width (8/12)
    case 3:
      return 12 // full width (12/12)
    default:
      return 4 // default to 1/3 width if span is not specified
  }
}

export function FeaturesSection(): ReactElement {
  return (
    <Container maxWidth="lg" sx={{ py: 10 }}>
      <Typography
        variant="h3"
        component="h2"
        align="center"
        gutterBottom
        sx={{
          fontWeight: 700,
          mb: 8,
          position: 'relative',
          '&:after': {
            content: '""',
            display: 'block',
            width: 80,
            height: 4,
            background: 'var(--gradient-primary)',
            margin: '1.5rem auto 0',
            borderRadius: 2,
          },
        }}>
        Powerful Features
      </Typography>

      <Grid container spacing={4}>
        {features.map((feature, index) => (
          <Grid
            key={index}
            size={{
              xs: 12, // Full width on extra small screens
              sm: 12, // Full width on small screens
              md: getGridSize(feature.span), // Responsive width based on span prop
            }}
            sx={{
              display: 'flex',
              '& > *': {
                width: '100%', // Ensure the card takes full width of the grid item
              },
            }}>
            <FeatureCard feature={feature} />
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
