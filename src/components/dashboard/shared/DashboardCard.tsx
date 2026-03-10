'use client'

import React, { type ReactElement } from 'react'
import { Card, CardContent, Typography, Box, Skeleton, Paper, type SxProps, type Theme } from '@mui/material'

interface DashboardCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  loading?: boolean
  subtitle?: string
  trend?: {
    value: number
    label: string
    isUp?: boolean
  }
}

export function DashboardCard({ title, value, icon, loading, subtitle, trend }: DashboardCardProps): ReactElement {
  if (loading) {
    return (
      <Card sx={{ height: '100%' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Skeleton variant="text" sx={{ ml: 2, flexGrow: 1 }} />
          </Box>
          <Skeleton variant="rectangular" height={40} />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
        },
      }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography color="text.secondary" variant="overline" sx={{ fontWeight: 700, letterSpacing: 1 }}>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>
              {value}
            </Typography>
          </Box>
          <Paper
            elevation={0}
            sx={{
              p: 1.5,
              borderRadius: 2,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
            {/* Ensure icon inherits contrast color and is large enough for visibility */}
            {React.isValidElement<{ sx?: SxProps<Theme> }>(icon)
              ? React.cloneElement(icon, { sx: { fontSize: 28, color: 'inherit' } })
              : icon}
          </Paper>
        </Box>

        {subtitle && (
          <Typography variant="body2" color="text.secondary">
            {subtitle}
          </Typography>
        )}

        {trend && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Typography
              variant="body2"
              sx={{
                color: trend.isUp ? 'success.main' : 'error.main',
                fontWeight: 600,
                mr: 1,
              }}>
              {trend.isUp ? '+' : ''}
              {trend.value}%
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {trend.label}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
