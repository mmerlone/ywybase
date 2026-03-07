/**
 * @fileoverview React Query provider with configured defaults.
 *
 * This module provides a React Query (TanStack Query) provider component with
 * pre-configured defaults for caching, stale time, garbage collection, and retry logic.
 * It also includes React Query DevTools for development.
 *
 * @module components/providers/QueryProvider
 */

'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * Error object with HTTP status code.
 * @interface ErrorWithStatus
 * @internal
 */
interface ErrorWithStatus {
  /** HTTP status code */
  status: number
  /** Additional error properties */
  [key: string]: unknown
}

/**
 * Type guard to check if error has status property.
 * @param {unknown} error - Error to check
 * @returns {boolean} True if error has status property
 * @internal
 */
function isErrorWithStatus(error: unknown): error is ErrorWithStatus {
  return (
    error !== null &&
    typeof error === 'object' &&
    'status' in error &&
    typeof (error as ErrorWithStatus).status === 'number'
  )
}

/**
 * React Query provider component with configured defaults.
 *
 * Wraps the application to provide React Query functionality with optimized
 * defaults for caching, stale time, garbage collection, and retry logic.
 * Includes React Query DevTools for development debugging.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} QueryClientProvider with DevTools
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * function App() {
 *   return (
 *     <QueryProvider>
 *       <YourAppComponents />
 *     </QueryProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Configuration**:
 * - **Stale Time**: 60 seconds (data considered fresh for 1 minute)
 * - **GC Time**: 10 minutes (unused data kept in cache for 10 minutes)
 * - **Retry Logic**: Up to 3 attempts, but not for 4xx errors (client errors)
 * - **DevTools**: Enabled in development, initially closed
 *
 * **Retry Strategy**:
 * - 4xx errors (400-499): No retry (client errors are not transient)
 * - 5xx errors (500-599): Retry up to 3 times (server errors may be transient)
 * - Network errors: Retry up to 3 times
 */
export function QueryProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 10 * 60 * 1000, // gcTime instead of cacheTime in v5
            retry: (failureCount: number, error: unknown): boolean => {
              if (isErrorWithStatus(error)) {
                if (error.status >= 400 && error.status < 500) {
                  return false
                }
              }
              return failureCount < 3
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
