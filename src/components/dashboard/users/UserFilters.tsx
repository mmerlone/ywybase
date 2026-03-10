'use client'
import type React from 'react'
import type { ReactElement } from 'react'

import { Box, FormControl, InputLabel, Select, MenuItem, Paper, Stack, Button } from '@mui/material'
import { RestartAlt as ResetIcon } from '@mui/icons-material'
import { SearchInput } from '../shared/SearchInput'

import { type UserStatusFilter, UserStatusFilterEnum } from '@/types/profile.types'
import { type UserRoleFilter, UserRoleFilterEnum } from '@/types/admin.types'

/**
 * Props for UserFilters component.
 */
interface UserFiltersProps {
  /** Current search query string */
  search: string
  /** Callback when search value changes */
  onSearchChange: (value: string) => void
  /** Current status filter value */
  status: UserStatusFilter
  /** Callback when status filter changes */
  onStatusChange: (value: UserStatusFilter) => void
  /** Current role filter value */
  role: UserRoleFilter
  /** Callback when role filter changes */
  onRoleChange: (value: UserRoleFilter) => void
  /** Callback to reset all filters to defaults */
  onReset: () => void
}

/**
 * Filter controls for the users management table.
 *
 * Provides search input, status dropdown, and reset button.
 * Responsive layout: stacked on mobile, horizontal on desktop.
 *
 * @param props - Component props for filter state and callbacks
 * @returns Filter controls wrapped in a Paper container
 */
export function UserFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  role,
  onRoleChange,
  onReset,
}: UserFiltersProps): ReactElement {
  return (
    <Paper sx={{ p: 2, mb: 3, borderRadius: 2, boxShadow: 0, border: '1px solid', borderColor: 'divider' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
        <Box sx={{ flexGrow: 1, width: '100%' }}>
          <SearchInput placeholder="Search by name or email..." value={search} onChange={onSearchChange} />
        </Box>

        <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel id="status-filter-label">Status</InputLabel>
          <Select
            labelId="status-filter-label"
            id="status-filter"
            value={status}
            label="Status"
            onChange={(e) => onStatusChange(e.target.value as UserStatusFilter)}>
            {Object.values(UserStatusFilterEnum).map((value) => {
              const label =
                value === UserStatusFilterEnum.ALL ? 'All Statuses' : value.charAt(0).toUpperCase() + value.slice(1)
              return (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150, width: { xs: '100%', md: 'auto' } }}>
          <InputLabel id="role-filter-label">Role</InputLabel>
          <Select
            labelId="role-filter-label"
            id="role-filter"
            value={role}
            label="Role"
            onChange={(e) => onRoleChange(e.target.value as UserRoleFilter)}>
            {Object.values(UserRoleFilterEnum).map((value) => {
              const label =
                value === UserRoleFilterEnum.ALL ? 'All Roles' : value.charAt(0).toUpperCase() + value.slice(1)
              return (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              )
            })}
          </Select>
        </FormControl>

        <Button
          variant="outlined"
          startIcon={<ResetIcon />}
          onClick={onReset}
          sx={{
            height: 40,
            whiteSpace: 'nowrap',
            width: { xs: '100%', md: 120 },
            flexShrink: 0,
          }}>
          Reset
        </Button>
      </Stack>
    </Paper>
  )
}
