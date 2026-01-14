import { NextResponse } from 'next/server'

export class MiddlewareError extends Error {
  constructor(
    message: string,
    public status: number = 500,
    public code?: string
  ) {
    super(message)
    this.name = 'MiddlewareError'
  }
}

type MiddlewareErrorContext = {
  pathname?: string
}

function generateReferenceId(): string {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID()
    }
  } catch {
    // ignore and fall back below
  }

  return `mid-${Math.random().toString(36).slice(2, 10)}`
}

export function handleMiddlewareError(error: unknown, context: MiddlewareErrorContext = {}): NextResponse {
  const referenceId = generateReferenceId()

  if (error instanceof MiddlewareError) {
    return new NextResponse(
      JSON.stringify({
        error: {
          message: error.message,
          code: error.code ?? 'MIDDLEWARE_ERROR',
          status: error.status,
          path: context.pathname,
          referenceId,
        },
      }),
      { status: error.status, headers: { 'content-type': 'application/json' } }
    )
  }

  const fallbackMessage = error instanceof Error ? error.message : 'Unexpected middleware failure'

  return new NextResponse(
    JSON.stringify({
      error: {
        message: fallbackMessage,
        code: 'MIDDLEWARE_UNEXPECTED',
        status: 500,
        path: context.pathname,
        referenceId,
      },
    }),
    { status: 500, headers: { 'content-type': 'application/json' } }
  )
}
