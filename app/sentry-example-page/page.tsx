import type { Metadata } from 'next'
import { SentryExampleView } from '@/components/example/SentryExampleView'
import { getSentryEnvStatus } from '@/config/sentry-public'
import { SITE_CONFIG } from '@/config/site'
import { Alert, Box, Container, Link as MuiLink } from '@mui/material'

export const metadata: Metadata = {
  title: 'Sentry Example',
  description: 'Demonstration of Sentry error tracking integration',
}

export default function Page(): JSX.Element {
  const sentryStatus = getSentryEnvStatus()
  if (!sentryStatus.isConfigured) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Alert severity="warning">
            Sentry configuration is missing; error tracking features are disabled until the required environment
            variables are set. See the setup guide in the README.{' '}
            <MuiLink href={`${SITE_CONFIG.github}#-sentry-error-tracking`} target="_blank" rel="noreferrer">
              View instructions
            </MuiLink>
          </Alert>
        </Box>
      </Container>
    )
  }
  return <SentryExampleView />
}
