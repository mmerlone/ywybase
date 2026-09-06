'use client'

import type { ReactElement } from 'react'
import { ArrowOutward, AutoAwesome, Bolt, GitHub, RocketLaunch } from '@mui/icons-material'
import { Box, Button, Chip, Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import Link from 'next/link'

import { SITE_CONFIG } from '@/config/site'

interface ProofStat {
  value: string
  label: string
  description: string
}

interface ArchitectureStep {
  title: string
  description: string
}

const proofChips: readonly string[] = [
  'Next.js 15 App Router',
  'React Server Components',
  'Supabase Auth + Postgres',
  'MUI 7 + Pigment CSS',
  'Zod + React Hook Form',
  'Sentry + Pino',
]

const shippedItems: readonly string[] = [
  'Authentication flows with Supabase and protected routes',
  'Typed forms, validation, server actions, and React Query patterns',
  'Security middleware, consent tooling, and production-minded defaults',
  'Themeable MUI 7 UI with responsive layouts and accessibility in mind',
]

const architectureSteps: readonly ArchitectureStep[] = [
  {
    title: 'Components',
    description: 'Keep UI expressive, accessible, and focused on rendering.',
  },
  {
    title: 'Hooks',
    description: 'Encapsulate client state and server-state orchestration cleanly.',
  },
  {
    title: 'Server Actions',
    description: 'Own mutations, validation, and error boundaries closer to the backend.',
  },
  {
    title: 'Database',
    description: 'Let Supabase, Postgres, and RLS enforce persistence and access rules.',
  },
]

const proofStats: readonly ProofStat[] = [
  {
    value: '1 base',
    label: 'for product, auth, and ops',
    description: 'Start with the boring but critical pieces already thought through.',
  },
  {
    value: '0 magic',
    label: 'in the data flow',
    description: 'Clear boundaries from components to hooks to server actions to database.',
  },
  {
    value: 'Built-in',
    label: 'security and observability',
    description: 'RLS, CSRF, rate limiting, structured logging, and Sentry are part of the baseline.',
  },
]

export function HeroSection(): ReactElement {
  const siteName = SITE_CONFIG.name

  return (
    <Box
      className="hero-section"
      component="section"
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        backgroundImage: [
          `radial-gradient(circle at top left, rgb(${theme.vars.palette.primary.mainChannel} / 0.16), transparent 28%)`,
          `radial-gradient(circle at top right, rgb(${theme.vars.palette.warning.mainChannel} / 0.14), transparent 24%)`,
          `linear-gradient(180deg, color-mix(in srgb, ${theme.vars.palette.background.paper} 92%, transparent) 0%, ${theme.vars.palette.background.default} 28%)`,
        ].join(','),
      })}>
      <Container maxWidth="lg" component="div" sx={{ py: { xs: 9, md: 12 } }}>
        <Grid container spacing={{ xs: 6, md: 8 }} alignItems="center">
          <Grid size={{ xs: 12, md: 7 }}>
            <Stack spacing={4}>
              <Chip
                icon={<AutoAwesome />}
                label="Open source foundation for serious Next.js apps"
                color="primary"
                variant="outlined"
                sx={{
                  alignSelf: 'flex-start',
                  px: 1,
                  borderRadius: 999,
                  borderColor: (theme) => `rgb(${theme.vars.palette.primary.mainChannel} / 0.35)`,
                  bgcolor: (theme) => `rgb(${theme.vars.palette.primary.mainChannel} / 0.08)`,
                }}
              />

              <Stack spacing={3}>
                <Typography
                  component="h1"
                  sx={{
                    fontSize: { xs: '3rem', sm: '3.75rem', md: '5rem' },
                    fontWeight: 900,
                    lineHeight: 0.95,
                    letterSpacing: '-0.04em',
                    textWrap: 'balance',
                  }}>
                  Build the first 80% of your product with confidence.
                </Typography>

                <Typography
                  variant="h5"
                  color="text.secondary"
                  sx={{
                    maxWidth: 760,
                    lineHeight: 1.55,
                    textWrap: 'pretty',
                  }}>
                  {siteName} exists for teams and solo builders who are tired of reassembling the same auth,
                  architecture, validation, security, theming, and observability stack every time a new idea deserves to
                  become a real application.
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.25} useFlexGap flexWrap="wrap">
                {proofChips.map((chip) => (
                  <Chip
                    key={chip}
                    label={chip}
                    variant="filled"
                    sx={{
                      borderRadius: 999,
                      bgcolor: (theme) => `color-mix(in srgb, ${theme.vars.palette.background.paper} 84%, transparent)`,
                      border: (theme) => `1px solid color-mix(in srgb, ${theme.vars.palette.divider} 80%, transparent)`,
                      fontWeight: 600,
                    }}
                  />
                ))}
              </Stack>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Button
                  component={Link}
                  href="/demos"
                  size="large"
                  variant="contained"
                  startIcon={<RocketLaunch />}
                  sx={{
                    minWidth: 190,
                    py: 1.5,
                    borderRadius: 999,
                    boxShadow: (theme) => `0 16px 40px rgb(${theme.vars.palette.primary.mainChannel} / 0.28)`,
                    whiteSpace: 'nowrap',
                  }}>
                  Explore the demos
                </Button>
                <Button
                  component={Link}
                  href={SITE_CONFIG.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="large"
                  variant="outlined"
                  startIcon={<GitHub />}
                  endIcon={<ArrowOutward />}
                  sx={{ minWidth: 190, py: 1.5, borderRadius: 999, whiteSpace: 'nowrap' }}>
                  View on GitHub
                </Button>
                <Button component={Link} href="/about" size="large" variant="text" sx={{ fontWeight: 700 }}>
                  Why this project exists
                </Button>
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Stack spacing={3}>
              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 6,
                  border: (theme) => `1px solid color-mix(in srgb, ${theme.vars.palette.divider} 75%, transparent)`,
                  background: (theme) =>
                    `linear-gradient(180deg, color-mix(in srgb, ${theme.vars.palette.background.paper} 94%, transparent) 0%, color-mix(in srgb, ${theme.vars.palette.background.paper} 80%, transparent) 100%)`,
                  backdropFilter: 'blur(16px)',
                }}>
                <Stack spacing={2.5}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Bolt color="primary" />
                    <Typography variant="h6" fontWeight={800}>
                      What ships on day one
                    </Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    {shippedItems.map((item) => (
                      <Box
                        key={item}
                        sx={{
                          px: 2,
                          py: 1.5,
                          borderRadius: 3,
                          bgcolor: (theme) => `rgb(${theme.vars.palette.primary.mainChannel} / 0.06)`,
                          border: (theme) => `1px solid rgb(${theme.vars.palette.primary.mainChannel} / 0.14)`,
                        }}>
                        <Typography variant="body2" sx={{ lineHeight: 1.65 }}>
                          {item}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>

              <Paper
                elevation={0}
                sx={{
                  p: { xs: 3, md: 4 },
                  borderRadius: 6,
                  border: (theme) => `1px solid color-mix(in srgb, ${theme.vars.palette.divider} 75%, transparent)`,
                  bgcolor: (theme) => `color-mix(in srgb, ${theme.vars.palette.background.paper} 82%, transparent)`,
                }}>
                <Stack spacing={2.5}>
                  <Typography variant="h6" fontWeight={800}>
                    The core flow stays simple
                  </Typography>
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    divider={<Divider flexItem orientation="vertical" />}
                    spacing={{ xs: 1.5, sm: 0 }}>
                    {architectureSteps.map((step) => (
                      <Box key={step.title} sx={{ flex: 1, pr: { sm: 2 } }}>
                        <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 800, mb: 0.75 }}>
                          {step.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                          {step.description}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Grid>
        </Grid>

        <Grid container spacing={3} sx={{ mt: { xs: 5, md: 7 } }}>
          {proofStats.map((stat) => (
            <Grid key={stat.label} size={{ xs: 12, md: 4 }}>
              <Paper
                elevation={0}
                sx={{
                  height: '100%',
                  p: 3,
                  borderRadius: 4,
                  border: (theme) => `1px solid color-mix(in srgb, ${theme.vars.palette.divider} 70%, transparent)`,
                  bgcolor: (theme) => `color-mix(in srgb, ${theme.vars.palette.background.paper} 72%, transparent)`,
                }}>
                <Typography
                  sx={{
                    fontSize: { xs: '1.8rem', md: '2.15rem' },
                    fontWeight: 900,
                    lineHeight: 1,
                    mb: 1,
                  }}>
                  {stat.value}
                </Typography>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
                  {stat.label}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>
                  {stat.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}
