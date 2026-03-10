'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { Breadcrumbs, Link, Typography, Box, Container } from '@mui/material'
import NavigateNextIcon from '@mui/icons-material/NavigateNext'

import { useBreadcrumbs } from '@/hooks/useBreadcrumbs'

export function PageBreadcrumbs(): ReactElement | null {
  const breadcrumbs = useBreadcrumbs()

  // Don't render if no breadcrumbs (e.g., on home page)
  if (breadcrumbs.length === 0) {
    return null
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 2, pt: 2 }}>
        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} aria-label="breadcrumb">
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1

            if (isLast) {
              // Current page - not clickable
              return (
                <Typography key={item.href || index} color="text.primary" sx={{ fontWeight: 500 }}>
                  {item.label}
                </Typography>
              )
            }

            return (
              <Link key={item.href} href={item.href} underline="hover" color="primary" sx={{ cursor: 'pointer' }}>
                {item.label}
              </Link>
            )
          })}
        </Breadcrumbs>
      </Box>
    </Container>
  )
}
