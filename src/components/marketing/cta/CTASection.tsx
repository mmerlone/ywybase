'use client'

import type { ReactElement } from 'react'
import { ArrowOutward, GitHub } from '@mui/icons-material'
import { Button, Container, Grid, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import Link from 'next/link'

import { SITE_CONFIG } from '@/config/site'

export function CTASection(): ReactElement {
  const githubUrl = SITE_CONFIG.github

  return (
    <Container component="section" maxWidth="lg" sx={{ py: { xs: 9, md: 12 }, pb: { xs: 12, md: 16 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 6,
          border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.82)}`,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, ${alpha(
              theme.palette.background.paper,
              0.95
            )} 48%, ${alpha(theme.palette.warning.main, 0.12)} 100%)`,
        }}>
        <Grid container spacing={4} alignItems="center">
          <Grid size={{ xs: 12, md: 8 }}>
            <Stack spacing={2}>
              <Typography variant="overline" sx={{ letterSpacing: '0.18em', fontWeight: 800, color: 'primary.main' }}>
                Ready to build
              </Typography>
              <Typography
                component="h2"
                sx={{
                  fontSize: { xs: '2rem', md: '3rem' },
                  fontWeight: 900,
                  lineHeight: 1.02,
                  textWrap: 'balance',
                }}>
                Start with a base that already knows what production work feels like.
              </Typography>
              <Typography variant="h6" color="text.secondary" sx={{ lineHeight: 1.65, maxWidth: 720 }}>
                Explore the demos, clone the repository, or jump straight into the quick start. YwyBase is designed to
                help you move from idea to dependable app with less setup drag.
              </Typography>
            </Stack>
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Stack spacing={2}>
              <Button
                component={Link}
                href={`${githubUrl}#-quick-start`}
                target="_blank"
                rel="noopener noreferrer"
                size="large"
                variant="contained"
                endIcon={<ArrowOutward />}
                sx={{ py: 1.5, borderRadius: 999 }}>
                Open quick start
              </Button>
              <Button
                component={Link}
                href="/demos"
                size="large"
                variant="outlined"
                sx={{ py: 1.5, borderRadius: 999 }}>
                See interactive demos
              </Button>
              <Button
                component={Link}
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                size="large"
                variant="text"
                startIcon={<GitHub />}
                sx={{ justifyContent: 'flex-start' }}>
                Browse the repository
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  )
}
