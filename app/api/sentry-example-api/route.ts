import { type NextRequest, type NextResponse } from 'next/server'

import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'

export const dynamic = 'force-dynamic'
class SentryExampleAPIError extends Error {
  constructor(message: string | undefined) {
    super(message)
    this.name = 'SentryExampleAPIError'
  }
}
// A faulty API route to test Sentry's error monitoring
export const GET = withRateLimit(
  'api',
  withApiErrorHandler(async (request: NextRequest): Promise<NextResponse> => {
    void request
    throw new SentryExampleAPIError('This error is raised on the backend called by the example page.')
  })
)
