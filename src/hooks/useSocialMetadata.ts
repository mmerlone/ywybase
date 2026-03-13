'use client'

import { useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

import { QUERY_CONFIG, QUERY_KEYS } from '@/config/query'
import { logger } from '@/lib/logger/client'
import { fetchSocialMetadata } from '@/lib/actions/social'
import type { OgMeta } from '@/lib/utils/social-metadata'

/**
 * Hook to fetch and cache Open Graph social metadata using React Query.
 * Provides a programmatic `fetch` method that components can call on demand.
 */
export function useSocialMetadata(): {
  fetch: (url: string) => Promise<OgMeta | null>
  getCached: (url: string) => OgMeta | null
} {
  const qc = useQueryClient()

  const fetch = useCallback(
    async (url: string): Promise<OgMeta | null> => {
      const key = QUERY_KEYS.socialMetadata(url)
      try {
        const data = await qc.fetchQuery<OgMeta | null>({
          queryKey: key,
          queryFn: async () => {
            try {
              const result = await fetchSocialMetadata(url)
              if (!result.success) {
                throw new Error(typeof result.error === 'string' ? result.error : 'Failed to fetch metadata')
              }

              const payload = result.data
              if (payload === undefined) return null
              if (payload.error !== undefined) throw new Error(payload.error)
              return payload
            } catch (err) {
              throw err
            }
          },
          staleTime: 60 * 60 * 1000, // 1 hour to match server TTL
          gcTime: QUERY_CONFIG.defaultGcTime,
          retry: false,
        })

        return data ?? null
      } catch (err) {
        logger.warn({ err: err instanceof Error ? err : new Error(String(err)), url }, 'useSocialMetadata.fetch failed')
        return null
      }
    },
    [qc]
  )

  const getCached = useCallback(
    (url: string): OgMeta | null => {
      const key = QUERY_KEYS.socialMetadata(url)
      return (qc.getQueryData<OgMeta | null>(key) as OgMeta | null) ?? null
    },
    [qc]
  )

  return { fetch, getCached }
}
