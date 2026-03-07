import React from 'react'
import { Grid, Typography, Box, Button, Stack, Paper } from '@mui/material'
import { People, TrendingUp, NewReleases, CheckCircle } from '@mui/icons-material'
import NextLink from 'next/link'

import { DashboardCard } from '@/components/dashboard/shared/DashboardCard'
import { ROUTES } from '@/config/routes'
import { queryAdminDashboardStats } from '@/lib/adminUsers'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: "Overview of your application's performance and users.",
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const stats = await queryAdminDashboardStats()

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Overview of your application&#39;s performance and users.
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button component={NextLink} href={ROUTES.DASHBOARD_USERS.path} variant="outlined" startIcon={<People />}>
            Manage Users
          </Button>
        </Stack>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Total Users"
            value={stats?.totalUsers ?? 0}
            icon={<People />}
            subtitle="Total registered accounts"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Active Users"
            value={stats?.activeUsers ?? 0}
            icon={<CheckCircle />}
            subtitle="Logged in last 30 days"
            // TODO: Calculate actual trend from historical data instead of hardcoded value
            trend={{ value: 12, label: 'from last month', isUp: true }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Recent Signups"
            value={stats?.recentSignups ?? 0}
            icon={<NewReleases />}
            subtitle="New users last 7 days"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <DashboardCard
            title="Pending Actions"
            value={stats?.pendingUsers ?? 0}
            icon={<TrendingUp />}
            subtitle="Users awaiting approval"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper
            sx={{
              p: 3,
              borderRadius: 2,
              height: '100%',
              minHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed',
              borderColor: 'divider',
              bgcolor: 'transparent',
            }}>
            <Box sx={{ textAlign: 'center' }}>
              <TrendingUp sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                Usage Analytics
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Chart visualizations will be available in the next update.
              </Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper
            sx={{ p: 3, borderRadius: 2, height: '100%', border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
              Quick Links
            </Typography>
            <Stack spacing={2}>
              <Button
                component={NextLink}
                href={ROUTES.DASHBOARD_USERS.path}
                fullWidth
                variant="text"
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
                startIcon={<People />}>
                View All Users
              </Button>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
