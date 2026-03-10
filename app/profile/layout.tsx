import type React from 'react'
import type { ReactElement } from 'react'
import type { ReactNode } from 'react'
import { QueryClient, dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/server'
import { getCachedProfile } from '@/lib/actions/profile'
import { QUERY_KEYS } from '@/config/query'
import { redirect } from 'next/navigation'

export default async function ProfileLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  // Prefetch profile into a server-side QueryClient and dehydrate
  // Uses getCachedProfile for request-level memoization (dedupes with page.tsx calls)
  const queryClient = new QueryClient()
  await queryClient.prefetchQuery({
    queryKey: QUERY_KEYS.profile(user.id),
    queryFn: async () => {
      const result = await getCachedProfile(user.id)
      if (!result.success) return null
      return result.data ?? null
    },
  })

  return <HydrationBoundary state={dehydrate(queryClient)}>{children}</HydrationBoundary>
}
