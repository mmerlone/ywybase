import type React from 'react'
import type { ReactElement } from 'react'
import { Container, Typography, Box, Paper } from '@mui/material'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Read our terms and conditions for using this service',
}

export default function TermsPage(): ReactElement {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Terms of Service
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: January 2025
        </Typography>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            1. Acceptance of Terms
          </Typography>
          <Typography variant="body1" paragraph>
            By accessing and using this Next.js App Boilerplate (&quot;the Service&quot;), you accept and agree to be
            bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not
            use this service.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            2. Description of Service
          </Typography>
          <Typography variant="body1" paragraph>
            This service provides a comprehensive Next.js application boilerplate with authentication, user management,
            and modern web development features. The service is provided &quot;as is&quot; for educational and
            development purposes.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            3. User Accounts
          </Typography>
          <Typography variant="body1" paragraph>
            To access certain features of the service, you may be required to create an account. You are responsible for
            maintaining the confidentiality of your account credentials and for all activities that occur under your
            account.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            4. Privacy and Data Protection
          </Typography>
          <Typography variant="body1" paragraph>
            Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the
            service, to understand our practices regarding the collection and use of your personal information.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            5. Acceptable Use
          </Typography>
          <Typography variant="body1" paragraph>
            You agree not to use the service for any unlawful purpose or in any way that could damage, disable,
            overburden, or impair the service. You also agree not to attempt to gain unauthorized access to any part of
            the service.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            6. Limitation of Liability
          </Typography>
          <Typography variant="body1" paragraph>
            The service is provided on an &quot;as is&quot; basis. We make no warranties, expressed or implied, and
            hereby disclaim and negate all other warranties including without limitation, implied warranties or
            conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual
            property.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            7. Changes to Terms
          </Typography>
          <Typography variant="body1" paragraph>
            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
            Your continued use of the service after any changes constitutes acceptance of the new terms.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            8. Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about these Terms of Service, please contact us through the appropriate channels
            provided in the application.
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
