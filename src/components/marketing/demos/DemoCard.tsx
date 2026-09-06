import type { ReactElement } from 'react'
import { ArrowOutward } from '@mui/icons-material'
import { Box, Card, CardContent, Stack, Typography } from '@mui/material'
import NextLink from 'next/link'

export type Demo = {
  title: string
  description: string
  href: string
}

interface DemoCardProps {
  demo: Demo
}

export function DemoCard({ demo }: DemoCardProps): ReactElement {
  return (
    <NextLink
      href={demo.href}
      aria-label={`Open ${demo.title} demo`}
      style={{ display: 'block', color: 'inherit', textDecoration: 'none' }}>
      <Card
        elevation={0}
        sx={{
          minHeight: 184,
          border: '1px solid var(--mui-palette-divider)',
          borderRadius: 4,
          background:
            'linear-gradient(135deg, var(--mui-palette-background-paper) 0%, color-mix(in srgb, var(--mui-palette-primary-main) 5%, var(--mui-palette-background-paper)) 100%)',
          transition: 'transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            borderColor: 'var(--mui-palette-primary-main)',
            boxShadow: '0 18px 42px rgb(0 0 0 / 0.16)',
          },
          '&:focus-within': {
            outline: '3px solid color-mix(in srgb, var(--mui-palette-primary-main) 32%, transparent)',
            outlineOffset: 3,
          },
        }}>
        <CardContent sx={{ height: '100%', p: { xs: 3, sm: 3.5 } }}>
          <Stack sx={{ height: '100%' }} justifyContent="space-between" spacing={4}>
            <Box>
              <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: '0.12em' }}>
                Interactive demo
              </Typography>
              <Typography variant="h5" component="h2" sx={{ mt: 1, fontWeight: 800 }}>
                {demo.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5, lineHeight: 1.7 }}>
                {demo.description}
              </Typography>
            </Box>

            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" color="primary.main" sx={{ fontWeight: 800 }}>
                Explore demo
              </Typography>
              <ArrowOutward
                className="demo-card-arrow"
                color="primary"
                sx={{
                  transition: 'transform 180ms ease',
                  '.MuiCard-root:hover &': { transform: 'translate(3px, -3px)' },
                }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </NextLink>
  )
}
