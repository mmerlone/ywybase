import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React, { type ReactNode, type ReactElement } from 'react'
import { headers } from 'next/headers'
import { Analytics } from '@vercel/analytics/next'
import { GoogleAnalytics } from '@next/third-parties/google'

import { LayoutClient } from './LayoutClient'

import { getSiteMetadata } from '@/config/site'
import { getSupabaseEnvStatus } from '@/config/supabase-public'
import { getFlashMessage } from '@/lib/utils/flash-messages.server'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const gaId = process.env.NEXT_PUBLIC_GA_ID

export async function generateMetadata(): Promise<Metadata> {
  return getSiteMetadata()
}

export default async function RootLayout({ children }: { children: ReactNode }): Promise<ReactElement> {
  // Get the CSP nonce from headers set by the request proxy
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') ?? undefined

  const initialFlash = await getFlashMessage()

  // Check Supabase configuration on the server to avoid hydration mismatches
  const supabaseStatus = getSupabaseEnvStatus()

  const isDev = process.env.NODE_ENV === 'development'
  return (
    <html lang="en" suppressHydrationWarning>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
      <head>
        <InitColorSchemeScript attribute="class" modeStorageKey="mui-mode" nonce={nonce} />
      </head>
      <body className={`${inter.className} font-sans`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true, key: 'mui', nonce }}>
          <LayoutClient supabaseStatus={supabaseStatus} isDev={isDev} initialFlash={initialFlash}>
            <Analytics />
            {children}
          </LayoutClient>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
