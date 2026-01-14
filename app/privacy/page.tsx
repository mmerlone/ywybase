import { Container, Typography, Box, Paper } from '@mui/material'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Learn how we collect, use, and protect your personal information',
}

export default function PrivacyPage(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Privacy Policy
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: January 2025
        </Typography>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            1. Information We Collect
          </Typography>
          <Typography variant="body1" paragraph>
            We collect information you provide directly to us, such as when you create an account, update your profile,
            or contact us. This may include your name, email address, profile information, and any other information you
            choose to provide.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            2. How We Use Your Information
          </Typography>
          <Typography variant="body1" paragraph>
            We use the information we collect to provide, maintain, and improve our services, process transactions, send
            you technical notices and support messages, and communicate with you about products, services, and
            promotional offers.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            3. Information Sharing
          </Typography>
          <Typography variant="body1" paragraph>
            We do not sell, trade, or otherwise transfer your personal information to third parties without your
            consent, except as described in this policy. We may share your information with service providers who assist
            us in operating our service, conducting our business, or serving our users.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            4. Data Security
          </Typography>
          <Typography variant="body1" paragraph>
            We implement appropriate security measures to protect your personal information against unauthorized access,
            alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic
            storage is 100% secure.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            5. Cookies and Tracking
          </Typography>
          <Typography variant="body1" paragraph>
            We use cookies and similar tracking technologies to enhance your experience on our service. You can control
            cookie preferences through our cookie consent banner and your browser settings. Essential cookies are
            necessary for the service to function properly.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            6. Your Rights
          </Typography>
          <Typography variant="body1" paragraph>
            You have the right to access, update, or delete your personal information. You may also have the right to
            restrict or object to certain processing of your data. To exercise these rights, please contact us through
            the appropriate channels provided in the application.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            7. Data Retention
          </Typography>
          <Typography variant="body1" paragraph>
            We retain your personal information for as long as necessary to provide our services and fulfill the
            purposes outlined in this policy, unless a longer retention period is required or permitted by law.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            8. Changes to This Policy
          </Typography>
          <Typography variant="body1" paragraph>
            We may update this privacy policy from time to time. We will notify you of any changes by posting the new
            policy on this page and updating the &quot;Last updated&quot; date.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            9. Contact Us
          </Typography>
          <Typography variant="body1" paragraph>
            If you have any questions about this Privacy Policy, please contact us through the appropriate channels
            provided in the application.
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
