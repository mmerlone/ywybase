import { Box, Button, Container, Stack, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import Link from 'next/link'

import { SITE_CONFIG } from '@/config/site'

export function CTASection(): JSX.Element {
  const githubUrl = SITE_CONFIG.navigation.find((item) => item.label === 'GitHub')?.link || ''

  return (
    <Container maxWidth="md">
      <Box textAlign="center" sx={{ p: 2, m: 4, mb: 8 }}>
        <Typography variant="h3" component="h2" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
          Ready to get started?
        </Typography>
        <Typography variant="h6" color="text.secondary" component="p" sx={{ mb: 4 }}>
          Join thousands of developers building amazing applications with {SITE_CONFIG.name}
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
          <Button component={Link} href="/auth?op=sign-up" variant="contained" size="large">
            Create an account
          </Button>
          <Button
            component={Link}
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="outlined"
            size="large"
            startIcon={<GitHubIcon />}>
            Fork on GitHub
          </Button>
        </Stack>
      </Box>
    </Container>
  )
}
