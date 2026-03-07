'use client'

import React, { useMemo } from 'react'
import { Box, Typography, IconButton, Tooltip } from '@mui/material'
import { Visibility as ViewIcon, Email as EmailIcon } from '@mui/icons-material'
import NextLink from 'next/link'
import { DataTable } from '../shared/DataTable'
import { UserAvatar } from '@/components/profile/UserAvatar'
import { UserStatusBadge } from './profile/UserStatusBadge'
import { UserRoleBadge } from './profile/UserRoleBadge'
import { type Profile } from '@/types/profile.types'
import { formatDistanceToNow } from 'date-fns'
import { PAGINATION_CONFIG } from '@/config/query'

interface UsersTableProps {
  users: Profile[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  loading?: boolean
  pageSizeOptions?: ReadonlyArray<number>
}

export function UsersTable({
  users,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  pageSizeOptions = PAGINATION_CONFIG.adminProfiles.allowedPageSizes,
}: UsersTableProps): JSX.Element {
  const columns = useMemo(
    () => [
      {
        id: 'display_name',
        label: 'User',
        minWidth: 200,
        format: (_: unknown, row: Profile): JSX.Element => (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ mr: 1.5 }}>
              <UserAvatar
                avatarUrl={row.avatar_url}
                displayName={row.display_name}
                email={row.email}
                size="thumbnail"
              />
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.display_name || 'No name'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {row.email}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: 'role',
        label: 'Role',
        minWidth: 120,
        format: (_: unknown, row: Profile): JSX.Element => <UserRoleBadge role={row.role} />,
      },
      {
        id: 'status',
        label: 'Status',
        minWidth: 100,
        format: (_: unknown, row: Profile): JSX.Element => <UserStatusBadge status={row.status} />,
      },
      {
        id: 'last_sign_in_at',
        label: 'Last Seen',
        minWidth: 150,
        format: (_: unknown, row: Profile): JSX.Element => {
          const dateStr = row.last_sign_in_at
          let formattedDate = 'Never'
          if (dateStr) {
            try {
              const parsedDate = new Date(dateStr)
              if (!isNaN(parsedDate.getTime())) {
                formattedDate = formatDistanceToNow(parsedDate, { addSuffix: true })
              }
            } catch {
              // Keep default 'Never' for invalid dates
            }
          }
          return <Typography variant="body2">{formattedDate}</Typography>
        },
      },
      {
        id: 'actions',
        label: 'Actions',
        minWidth: 80,
        align: 'right' as const,
        format: (_: unknown, row: Profile): JSX.Element => (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton size="small" component={NextLink} href={`/dashboard/users/${row.id}`}>
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Contact User">
              <IconButton
                size="small"
                component="a"
                href={`mailto:${row.email}`}
                disabled={!row.email}
                sx={{ opacity: row.email ? 1 : 0.5 }}>
                <EmailIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  )

  return (
    <DataTable
      columns={columns}
      rows={users}
      totalCount={totalCount}
      page={page}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      loading={loading}
      emptyMessage="No users found matching your filters"
      pageSizeOptions={pageSizeOptions}
      getRowId={(row: Profile) => row.id}
    />
  )
}
