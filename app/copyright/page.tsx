import { Container, Typography, Box, Paper } from '@mui/material'
import type { Metadata } from 'next'

import { SITE_CONFIG } from '@/config/site'

export const metadata: Metadata = {
  title: 'Copyright Notice',
  description: 'Copyright and intellectual property information for this application',
}

export default function CopyrightPage(): JSX.Element {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Copyright Notice
        </Typography>
        <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Last updated: January 2025
        </Typography>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom>
            Copyright Information
          </Typography>
          <Typography variant="body1" paragraph>
            © 2025 {SITE_CONFIG.name}. All rights reserved. This application and its original content, features, and
            functionality are owned by the project maintainers and are protected by international copyright, trademark,
            patent, trade secret, and other intellectual property or proprietary rights laws.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            Open Source Components
          </Typography>
          <Typography variant="body1" paragraph>
            This application incorporates various open-source software components, each governed by their respective
            licenses. These components include but are not limited to:
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Next.js - MIT License
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              React - MIT License
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Material UI - MIT License
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              TypeScript - Apache License 2.0
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              Supabase - Apache License 2.0
            </Typography>
          </Box>

          <Typography variant="h5" component="h2" gutterBottom>
            Usage Rights
          </Typography>
          <Typography variant="body1" paragraph>
            This boilerplate is provided for educational and development purposes. You may use, modify, and distribute
            this code in accordance with the project&apos;s license terms. However, you may not claim ownership of the
            original design and architecture concepts.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            Attribution
          </Typography>
          <Typography variant="body1" paragraph>
            When using this boilerplate as a foundation for your projects, attribution to the original work is
            appreciated but not required. If you choose to provide attribution, please include a reference to the
            original project repository.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            Third-Party Content
          </Typography>
          <Typography variant="body1" paragraph>
            Any third-party content, including but not limited to images, icons, fonts, and other assets, remains the
            property of their respective owners and is used under appropriate licenses or fair use provisions.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            DMCA Compliance
          </Typography>
          <Typography variant="body1" paragraph>
            We respect the intellectual property rights of others and expect our users to do the same. If you believe
            that your copyrighted work has been copied in a way that constitutes copyright infringement, please contact
            us with the relevant information.
          </Typography>

          <Typography variant="h5" component="h2" gutterBottom>
            Contact Information
          </Typography>
          <Typography variant="body1" paragraph>
            For any copyright-related inquiries or concerns, please contact us through the appropriate channels provided
            in the application.
          </Typography>
        </Paper>
      </Box>
    </Container>
  )
}
