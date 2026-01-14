import { Box, Chip, Container, Grid, Paper, Typography } from '@mui/material'
import type { Metadata } from 'next'
import { Ywy } from '@/components/marketing/ywy'

export const metadata: Metadata = {
  title: 'About Us',
  description: 'YwyBase - A modern Next.js boilerplate application',
}

export default function AboutPage(): JSX.Element {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          About This Project
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" sx={{ mb: 6 }}>
          YwyBase: Solid ground to build and grow.
        </Typography>

        <Box component="section">
          <Ywy />
        </Box>

        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                Project Overview
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                This Next.js App Boilerplate is a comprehensive, production-ready foundation for building modern web
                applications. It combines the latest technologies and best practices to provide developers with a robust
                starting point for their projects.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Built with accessibility in mind, this boilerplate follows WCAG 2.1 guidelines and implements semantic
                HTML structures. The codebase emphasizes clean architecture, strong typing, and maintainable code
                patterns following DRY and KISS principles.
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The application features a complete authentication system powered by Supabase, including user
                registration, login, password recovery, and profile management. The UI is built with Material UI
                components and supports both light and dark themes.
              </Typography>
            </Paper>

            <Paper sx={{ p: 4 }}>
              <Typography variant="h4" component="h2" gutterBottom>
                Key Features
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Authentication System:</strong> Complete user management with Supabase integration
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Modern UI:</strong> Material UI components with customizable theming
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Type Safety:</strong> Full TypeScript implementation with Zod validation
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Data Management:</strong> React Query for efficient data fetching and caching
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Form Handling:</strong> React Hook Form with comprehensive validation
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Code Quality:</strong> ESLint and Prettier configuration for consistent code style
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Accessibility:</strong> WCAG 2.1 compliant with semantic HTML and ARIA attributes
                </Typography>
                <Typography component="li" variant="body1" sx={{ mb: 1 }}>
                  <strong>Cookie Consent:</strong> GDPR-compliant cookie management system
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Technology Stack
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Frontend
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="Next.js 15" size="small" variant="outlined" color="success" />
                    <Chip label="React 18" size="small" variant="outlined" color="success" />
                    <Chip label="TypeScript" size="small" variant="outlined" color="success" />
                    <Chip label="Material UI" size="small" variant="outlined" color="success" />
                    <Chip label="Tailwind CSS" size="small" variant="outlined" color="success" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Backend & Database
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="Supabase" size="small" variant="outlined" color="success" />
                    <Chip label="PostgreSQL" size="small" variant="outlined" color="success" />
                    <Chip label="Row Level Security" size="small" variant="outlined" color="success" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    State & Forms
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="React Query" size="small" variant="outlined" color="success" />
                    <Chip label="React Hook Form" size="small" variant="outlined" color="success" />
                    <Chip label="Zod" size="small" variant="outlined" color="success" />
                    <Chip label="Vanilla CookieConsent" size="small" variant="outlined" color="success" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Development
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="ESLint" size="small" variant="outlined" color="success" />
                    <Chip label="Prettier" size="small" variant="outlined" color="success" />
                    <Chip label="Vercel" size="small" variant="outlined" color="success" />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Monitoring & Utilities
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="Sentry" size="small" variant="outlined" color="success" />
                    <Chip label="Pino Logger" size="small" variant="outlined" color="success" />
                    <Chip label="Moment Timezone" size="small" variant="outlined" color="success" />
                  </Box>
                </Box>
              </Box>
            </Paper>

            <Paper sx={{ p: 4 }}>
              <Typography variant="h5" component="h3" gutterBottom>
                Architecture Principles
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>DRY:</strong> Don&apos;t Repeat Yourself
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>KISS:</strong> Keep It Simple, Stupid
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Strong Typing:</strong> TypeScript throughout
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Clean Code:</strong> Readable and maintainable
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  <strong>Separation of Concerns:</strong> Modular architecture
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>

        {/* Third-Party Services Section */}
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h4" component="h2" gutterBottom align="center">
            Third-Party Services
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, textAlign: 'center' }} color="text.secondary">
            We gratefully acknowledge the following services that power this application
          </Typography>

          <Grid container spacing={3} sx={{ mt: 2 }}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Vercel
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Hosting and deployment platform providing seamless CI/CD, edge computing, and excellent developer
                  experience.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Sentry
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Error monitoring and performance tracking helping us deliver a reliable and bug-free user experience.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Supabase
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Backend-as-a-Service providing authentication, database, and real-time capabilities with PostgreSQL.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  Google Analytics
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Web analytics service helping us understand user behavior and improve the application experience.
                </Typography>
              </Box>
            </Grid>

            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" component="h3" gutterBottom>
                  ipgeolocation.io
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  IP geolocation service providing accurate country detection for personalized user experiences.
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              These services enable us to deliver a modern, scalable, and feature-rich application to our users.
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  )
}
