'use client'

import type { ReactElement } from 'react'
import { Grid, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { SectionHeading } from '@/components/marketing/shared/SectionHeading'

interface ValuePillar {
  title: string
  description: string
}

const valuePillars: readonly ValuePillar[] = [
  {
    title: 'Ship from structure, not scaffolding',
    description:
      'YwyBase gives you an opinionated starting point so you can begin shaping product value instead of rebuilding auth, forms, and architecture for the tenth time.',
  },
  {
    title: 'Move fast without losing the plot',
    description:
      'Strict typing, explicit dependencies, and clean layers keep velocity high while making the codebase easier to reason about as it grows.',
  },
  {
    title: 'Treat trust as a feature',
    description:
      'Security headers, CSRF protection, secure cookies, rate limiting, consent flows, and error tracking help you launch with more confidence on day one.',
  },
]

export function ValuePropsSection(): ReactElement {
  return (
    <Container component="section" maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
      <SectionHeading
        eyebrow="Why teams reach for it"
        title="A starter that respects both speed and maintainability."
        description="The best starter does more than render a nice hero. It reduces repeated decision fatigue, lowers setup risk, and gives future contributors a codebase that still makes sense after the honeymoon period."
      />

      <Grid container spacing={3}>
        {valuePillars.map((pillar) => (
          <Grid key={pillar.title} size={{ xs: 12, md: 4 }}>
            <Paper
              elevation={0}
              sx={{
                height: '100%',
                p: 3.5,
                borderRadius: 5,
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                background: (theme) =>
                  `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.94)} 0%, ${alpha(
                    theme.palette.primary.main,
                    0.04
                  )} 100%)`,
              }}>
              <Stack spacing={2}>
                <Typography variant="h5" component="h3" sx={{ fontWeight: 800, textWrap: 'balance' }}>
                  {pillar.title}
                </Typography>
                <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>
                  {pillar.description}
                </Typography>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  )
}
