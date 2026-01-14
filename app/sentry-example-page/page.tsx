import type { Metadata } from 'next'

import { SentryExampleView } from '@/components/example/SentryExampleView'

export const metadata: Metadata = {
  title: 'Sentry Example',
  description: 'Demonstration of Sentry error tracking integration',
}

export default function Page(): JSX.Element {
  return <SentryExampleView />
}
