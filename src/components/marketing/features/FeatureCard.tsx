'use client'

import type { ReactElement } from 'react'
import { Star } from '@mui/icons-material'
import { Box, Card, CardContent, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

export type Feature = {
  icon: ReactElement
  title: string
  description: string
  isHighlighted?: boolean
}

interface FeatureCardProps {
  feature: Feature
}

export function FeatureCard({ feature }: FeatureCardProps): ReactElement {
  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: 5,
        border: (theme) => `1px solid ${alpha(theme.palette.divider, feature.isHighlighted === true ? 0.9 : 0.78)}`,
        background: (theme) =>
          `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
            theme.palette.background.paper,
            0.84
          )} 100%)`,
        transition: 'transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: (theme) => `0 18px 48px ${alpha(theme.palette.common.black, 0.12)}`,
        },
        ...(feature.isHighlighted === true && {
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: (theme) =>
              `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.warning.main} 100%)`,
          },
        }),
      }}>
      <CardContent sx={{ height: '100%', display: 'flex', gap: 2.5, p: 3.5 }}>
        <Box
          sx={{
            display: 'inline-flex',
            flex: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            width: 54,
            height: 54,
            borderRadius: 3,
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
            color: 'primary.main',
            '& svg': {
              width: 26,
              height: 26,
            },
          }}>
          {feature.icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h6" component="h3" gutterBottom sx={{ mt: 0.5, fontWeight: 800 }}>
            {feature.title}
            {feature.isHighlighted === true && (
              <Star color="primary" sx={{ ml: 1, fontSize: '1rem', verticalAlign: 'middle' }} />
            )}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.75 }}>
            {feature.description}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}
