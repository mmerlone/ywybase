import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Container, Grid, Link, Typography } from '@mui/material'
import { SITE_CONFIG } from '@/config/site'

function BrazilBadge(): ReactElement {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 1,
        px: 1.25,
        py: 0.5,
        borderRadius: 999,
        border: '1px solid var(--mui-palette-divider)',
        backgroundColor: 'var(--mui-palette-background-default)',
        lineHeight: 1,
      }}>
      <Box component="span" role="img" aria-label="Brazil flag" sx={{ fontSize: '1rem' }}>
        🇧🇷
      </Box>
      <Typography component="span" variant="caption" sx={{ fontWeight: 700, letterSpacing: '0.04em' }}>
        Made in Brazil
      </Typography>
    </Box>
  )
}

export function Footer(): ReactElement {
  const siteName = SITE_CONFIG.name
  const siteDescription = SITE_CONFIG.description
  const isSmallFooter = SITE_CONFIG.layout.smallFooter
  const isFixedFooter = SITE_CONFIG.layout.fixedFooter

  if (isSmallFooter) {
    return (
      <Box
        component="footer"
        sx={{
          mt: 'auto',
          py: 2,
          borderTop: '1px solid var(--mui-palette-divider)',
          position: 'relative',
          backgroundColor: 'var(--mui-palette-background-paper)',
          ...(isFixedFooter
            ? {
                position: 'sticky',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 1100, // theme.zIndex.drawer + 1 default value
              }
            : {}),
        }}>
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1,
            }}>
            <Typography variant="body2">
              © {new Date().getFullYear()} {siteName}. All rights reserved.
            </Typography>
            <BrazilBadge />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Link href="/terms" underline="hover" variant="body2">
                Terms
              </Link>
              <Link href="/privacy" underline="hover" variant="body2">
                Privacy
              </Link>
              <Link href="/cookies" underline="hover" variant="body2">
                Cookies
              </Link>
            </Box>
          </Box>
        </Container>
      </Box>
    )
  }

  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 4,
        borderTop: '1px solid var(--mui-palette-divider)',
        position: 'relative',
        backgroundColor: 'var(--mui-palette-background-paper)',
        ...(isFixedFooter
          ? {
              position: 'sticky',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100, // theme.zIndex.drawer + 1 default value
            }
          : {}),
      }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" gutterBottom>
              {siteName}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {siteDescription}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="body2">Built with ❤️ using Next.js, Material UI, and Supabase.</Typography>
              <BrazilBadge />
            </Box>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="subtitle2" gutterBottom>
                Legal
              </Typography>
              <Link href="/terms" underline="hover" variant="body2">
                Terms of Service
              </Link>
              <Link href="/privacy" underline="hover" variant="body2">
                Privacy Policy
              </Link>
              <Link href="/cookies" underline="hover" variant="body2">
                Cookie Policy
              </Link>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                © {new Date().getFullYear()} {siteName}. All rights reserved.
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
