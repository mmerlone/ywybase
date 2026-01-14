import { NextRequest } from 'next/server'
import { buildLogger } from '@/lib/logger/client'
import { RequestContext } from './types'

function generateRequestId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    // ignore and fall back
  }

  return `req-${Math.random().toString(36).slice(2, 10)}`
}

export function createContext(request: NextRequest): RequestContext {
  const requestId = request.headers.get('x-request-id') || generateRequestId()

  return {
    requestId,
    timestamp: new Date().toISOString(),
    logger: buildLogger('middleware-request').child({ requestId }),
  }
}
