'use client'

import React, { useMemo, type ReactElement } from 'react'
import type { ReactNode, ChangeEvent } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Skeleton,
} from '@mui/material'

interface Column<T> {
  id: keyof T | string
  label: string
  align?: 'left' | 'center' | 'right'
  minWidth?: number
  format?: (value: unknown, row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  rows: T[]
  totalCount: number
  page: number
  pageSize: number
  onPageChange: (newPage: number) => void
  onPageSizeChange: (newPageSize: number) => void
  loading?: boolean
  emptyMessage?: string
  pageSizeOptions?: ReadonlyArray<number>
  /** Custom function to extract row ID for key prop. Defaults to row.id */
  getRowId?: (row: T) => string | number
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const

/**
 * Generic data table component with pagination support.
 *
 * @template T - Row data type
 * @param props - DataTable props
 * @returns DataTable component
 */
export function DataTable<T>({
  columns,
  rows,
  totalCount,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  loading,
  emptyMessage = 'No data found',
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  getRowId,
}: DataTableProps<T>): ReactElement {
  const handleChangePage = (_: unknown, newPage: number): void => {
    onPageChange(newPage + 1) // MUI uses 0-based, our API uses 1-based
  }

  const handleChangeRowsPerPage = (event: ChangeEvent<HTMLInputElement>): void => {
    onPageSizeChange(parseInt(event.target.value, 10))
    onPageChange(1)
  }

  // Ensure pageSize is always one of the allowed values
  // If an invalid pageSize is passed, we use the safe value internally
  // without triggering parent state updates (which could cause loops)
  const allowedSizes = useMemo(() => pageSizeOptions, [pageSizeOptions])
  const defaultPageSize = allowedSizes[0] ?? 10
  const safePageSize = allowedSizes.includes(pageSize) ? pageSize : defaultPageSize

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, boxShadow: 1 }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader aria-label="data table">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.id as string}
                  align={column.align}
                  style={{ minWidth: column.minWidth, fontWeight: 700 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from(new Array(5)).map(
                (_, index): ReactElement => (
                  <TableRow key={index}>
                    {columns.map(
                      (column): ReactElement => (
                        <TableCell key={column.id as string}>
                          <Skeleton variant="text" />
                        </TableCell>
                      )
                    )}
                  </TableRow>
                )
              )
            ) : rows.length > 0 ? (
              rows.map((row, index): ReactElement => {
                const rowId = getRowId ? getRowId(row) : ((row as { id?: string | number }).id ?? index)
                return (
                  <TableRow hover tabIndex={-1} key={rowId}>
                    {columns.map((column): ReactElement => {
                      const columnId = column.id as string
                      const rowData = row as Record<string, unknown>
                      const value = rowData[columnId]

                      return (
                        <TableCell key={columnId} align={column.align}>
                          {column.format
                            ? column.format(value, row)
                            : typeof value === 'string' || typeof value === 'number'
                              ? value
                              : null}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">
                    {emptyMessage}
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={allowedSizes as number[]}
        component="div"
        count={totalCount}
        rowsPerPage={safePageSize}
        page={page - 1}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
      />
    </Paper>
  )
}
