'use client'

import type { ReactElement } from 'react'
import { Speed } from '@mui/icons-material'
import { Container, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { SectionHeading } from '@/components/marketing/shared/SectionHeading'

const guidingPoints: readonly string[] = [
  'Share practical patterns instead of private shortcuts.',
  'Favor explicit structure over clever abstractions.',
  'Make security, accessibility, and observability part of the starting line.',
]

export function MotivationSection(): ReactElement {
  return (
    <Container component="section" maxWidth="lg" sx={{ py: { xs: 9, md: 12 } }}>
      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <SectionHeading
            eyebrow="Project motivation"
            title="Built from real solo-builder pressure, then opened to the community."
            description="YwyBase began as a practical experiment: how far can one developer, collaborating with modern AI tools across engineering, QA, and DevOps, push a production-grade Next.js foundation in limited time? The answer became a shared base meant to save others from repeating the same setup work."
          />
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Paper
            elevation={0}
            sx={{
              height: '100%',
              p: { xs: 3, md: 4 },
              borderRadius: 6,
              border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.82)}`,
              background: (theme) =>
                `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.12)} 0%, ${alpha(
                  theme.palette.primary.main,
                  0.08
                )} 100%)`,
            }}>
            <Stack spacing={3}>
              <Typography
                sx={{
                  fontSize: { xs: '1.5rem', md: '1.8rem' },
                  lineHeight: 1.35,
                  fontWeight: 800,
                  textWrap: 'balance',
                }}>
                &quot;A solid ground to scale&quot; means fewer reinventions, clearer decisions, and more energy left
                for the product itself.
              </Typography>
              <Divider />
              <Stack spacing={2}>
                {guidingPoints.map((point) => (
                  <Stack key={point} direction="row" spacing={1.5} alignItems="flex-start">
                    <Speed color="primary" sx={{ mt: 0.25 }} />
                    <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>
                      {point}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  )
}
