'use client'

import type { ReactElement } from 'react'
import { Stack, Typography } from '@mui/material'

interface SectionHeadingProps {
  eyebrow: string
  title: string
  description: string
  align?: 'left' | 'center'
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps): ReactElement {
  return (
    <Stack
      spacing={2}
      sx={{
        mb: 6,
        maxWidth: align === 'center' ? 760 : 720,
        mx: align === 'center' ? 'auto' : 0,
        textAlign: align,
      }}>
      <Typography
        variant="overline"
        sx={{
          letterSpacing: '0.18em',
          fontWeight: 800,
          color: 'primary.main',
        }}>
        {eyebrow}
      </Typography>
      <Typography
        component="h2"
        sx={{
          fontSize: { xs: '2rem', md: '3rem' },
          fontWeight: 800,
          lineHeight: 1.05,
          textWrap: 'balance',
        }}>
        {title}
      </Typography>
      <Typography
        variant="h6"
        color="text.secondary"
        sx={{
          lineHeight: 1.65,
          textWrap: 'pretty',
        }}>
        {description}
      </Typography>
    </Stack>
  )
}
