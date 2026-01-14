// src/middleware/request-logger.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('request-logger')

export async function requestLoggerMiddleware(request: NextRequest, response: NextResponse): Promise<NextResponse> {
  const { method, url, headers } = request
  const userAgent = headers.get('user-agent') ?? 'unknown'
  const ip = headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown'

  logger.info(
    {
      method,
      url,
      userAgent,
      ip,
    },
    'Incoming request'
  )

  return response
}
