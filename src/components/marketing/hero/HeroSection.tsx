import type React from 'react'
import type { ReactElement } from 'react'
import { Box, Button, Container, Typography } from '@mui/material'
import type {} from '@mui/material/themeCssVarsAugmentation'
import Link from 'next/link'
import { SITE_CONFIG } from '@/config/site'

export function HeroSection(): ReactElement {
  const siteName = SITE_CONFIG.name
  const siteDescription = SITE_CONFIG.description
  return (
    <Box
      component="section"
      className="section-hero"
      sx={{
        position: 'relative',
        width: '100%',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        backgroundImage: 'url(/hero.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        overflow: 'hidden',
        pt: '64px', // Add padding to account for the fixed header
        '&::after': {
          content: '""',
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '100px',
          background: 'linear-gradient(to bottom, transparent, var(--mui-palette-background-default))',
          zIndex: 2,
          pointerEvents: 'none',
        },
      }}>
      <Container
        maxWidth="md"
        disableGutters
        sx={{
          position: 'relative',
          zIndex: 2,
          color: 'common.white',
          textAlign: 'center',
          py: 2,
          px: { xs: 2, sm: 3 },
        }}>
        <Typography
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            fontSize: { xs: '2.5rem', sm: '3rem', md: '3.75rem' },
            lineHeight: 1.2,
            mb: 4,
            textShadow: 'var(--text-shadow-strong)',
          }}>
          Welcome to {siteName}
        </Typography>
        <Typography
          variant="h5"
          sx={{
            mb: 6,
            textShadow: 'var(--text-shadow-medium)',
            maxWidth: '800px',
            mx: 'auto',
          }}>
          {siteDescription}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            justifyContent: 'center',
            flexWrap: 'wrap',
            '& .MuiButton-root': {
              minWidth: '160px',
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              borderRadius: '50px',
              boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
              },
            },
          }}>
          <Button
            component={Link}
            href="/auth?op=sign-up"
            variant="contained"
            color="primary"
            size="large"
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}>
            Get Started
          </Button>
          <Button
            component={Link}
            href="/about"
            variant="outlined"
            size="large"
            sx={{
              color: 'common.white',
              borderColor: 'common.white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'common.white',
              },
            }}>
            Learn More
          </Button>
        </Box>
      </Container>
    </Box>
  )
}
