import { NextResponse } from 'next/server'

export function forbidden(message: string = 'Forbidden'): NextResponse {
  return new NextResponse(JSON.stringify({ error: { message, code: 'FORBIDDEN' } }), {
    status: 403,
    headers: { 'content-type': 'application/json' },
  })
}

export function unauthorized(message: string = 'Unauthorized'): NextResponse {
  return new NextResponse(JSON.stringify({ error: { message, code: 'UNAUTHORIZED' } }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  })
}

export function tooManyRequests(message: string = 'Too Many Requests'): NextResponse {
  return new NextResponse(JSON.stringify({ error: { message, code: 'TOO_MANY_REQUESTS' } }), {
    status: 429,
    headers: { 'content-type': 'application/json' },
  })
}

export function badRequest(message: string = 'Bad Request'): NextResponse {
  return new NextResponse(JSON.stringify({ error: { message, code: 'BAD_REQUEST' } }), {
    status: 400,
    headers: { 'content-type': 'application/json' },
  })
}
