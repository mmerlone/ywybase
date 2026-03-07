import React from 'react'
import { HydrationBoundary, QueryClient, dehydrate } from '@tanstack/react-query'
import { Box, Typography } from '@mui/material'

import UsersManagementClient from '@/components/dashboard/users/UsersManagementClient'
import { fetchAdminUsersAction } from '@/lib/actions/admin/users'
import { queryAdminUsers } from '@/lib/adminUsers'
import { PAGINATION_CONFIG, QUERY_KEYS } from '@/config/query'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'User Management',
  description: 'View and manage user accounts, roles, and status.',
}

export default async function UsersManagementPage(): Promise<JSX.Element> {
  const page = 1
  const pageSize = PAGINATION_CONFIG.adminProfiles.defaultPageSize
  const status = undefined
  const role = undefined
  const search = undefined
  const queryKey = QUERY_KEYS.adminProfiles({ page, pageSize, search, status, role })

  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: async () => queryAdminUsers({ page, pageSize, status, role, search }),
  })

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage user accounts, roles, and status.
        </Typography>
      </Box>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersManagementClient
          initialPage={page}
          initialPageSize={pageSize}
          initialSearch={search}
          initialStatus={status}
          initialRole={role}
          pageSizeOptions={PAGINATION_CONFIG.adminProfiles.allowedPageSizes}
          fetchProfilesAction={fetchAdminUsersAction}
        />
      </HydrationBoundary>
    </Box>
  )
}
