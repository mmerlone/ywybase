import InitColorSchemeScript from '@mui/material/InitColorSchemeScript'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ReactNode } from 'react'
import { headers } from 'next/headers'

import { LayoutClient } from './LayoutClient'

import { getSiteMetadata } from '@/config/site'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

export const metadata: Metadata = getSiteMetadata()

export default async function RootLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  // Get the CSP nonce from headers set by middleware
  const headersList = await headers()
  const nonce = headersList.get('x-nonce') || undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-sans`}>
        <AppRouterCacheProvider options={{ enableCssLayer: true, key: 'mui', nonce }}>
          <InitColorSchemeScript attribute="class" nonce={nonce} />
          <LayoutClient>{children}</LayoutClient>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
