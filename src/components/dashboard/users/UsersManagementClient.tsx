'use client'

import React, { useCallback, useState } from 'react'

import { useAdminProfiles } from '@/hooks/useAdminUsers'
import type { PaginatedProfilesResult, ProfilesQueryOptions, UserRoleFilter } from '@/types/admin.types'
import type { UserStatusFilter } from '@/types/profile.types'
import type { AuthResponse } from '@/types/error.types'
import { UserFilters } from './UserFilters'
import { UsersTable } from './UsersTable'

interface Props {
  initialPage?: number
  initialPageSize?: number
  initialSearch?: string | undefined
  initialStatus?: UserStatusFilter | undefined
  initialRole?: UserRoleFilter | undefined
  pageSizeOptions: readonly number[]
  fetchProfilesAction: (options: ProfilesQueryOptions) => Promise<AuthResponse<PaginatedProfilesResult>>
}

/**
 * Client-side admin users management surface.
 *
 * Reads hydrated React Query data from the app-level query provider and
 * falls back to client-side refetching for pagination and filtering changes.
 */
export default function UsersManagementClient({
  initialPage = 1,
  initialPageSize = 10,
  initialSearch,
  initialStatus = 'all',
  initialRole = 'all',
  pageSizeOptions,
  fetchProfilesAction,
}: Props): JSX.Element {
  const [page, setPage] = useState(initialPage)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [search, setSearch] = useState(initialSearch)
  const [status, setStatus] = useState(initialStatus)
  const [role, setRole] = useState(initialRole)

  const { profiles, total, isLoading, isFetching } = useAdminProfiles(
    {
      page,
      pageSize,
      search,
      status,
      role,
    },
    { fetchProfiles: fetchProfilesAction }
  )

  const handleReset = useCallback(() => {
    setSearch(undefined)
    setStatus('all')
    setRole('all')
    setPage(1)
  }, [])

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value || undefined)
    setPage(1)
  }, [])

  const handleStatusChange = useCallback((value: UserStatusFilter | undefined) => {
    setStatus(value ?? 'all')
    setPage(1)
  }, [])

  const handleRoleChange = useCallback((value: UserRoleFilter | undefined) => {
    setRole(value ?? 'all')
    setPage(1)
  }, [])

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
  }, [])

  const handlePageSizeChange = useCallback((newSize: number) => {
    setPage(1)
    setPageSize(newSize)
  }, [])

  return (
    <div>
      <UserFilters
        search={search ?? ''}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={handleStatusChange}
        role={role}
        onRoleChange={handleRoleChange}
        onReset={handleReset}
      />

      <UsersTable
        users={profiles}
        totalCount={total}
        page={page}
        pageSize={pageSize}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        loading={isLoading || isFetching}
        pageSizeOptions={pageSizeOptions}
      />
    </div>
  )
}
