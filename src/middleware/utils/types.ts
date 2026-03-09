import { type NextResponse } from 'next/server'
import type { Logger } from '@/types/logger.types'
import { type User, type Session as SupabaseSession } from '@supabase/supabase-js'

export type AuthUser = User

// Re-export Supabase's Session type for better type safety
export type Session = SupabaseSession

// Simplified session interface for middleware use
export interface MiddlewareSession {
  id: string // User ID (not access token for security)
  expires_at: number // Session expiration timestamp (UNIX)
  user: AuthUser // Full user object from Supabase
  issued_at?: number // When the session was issued (optional for debugging)
  refreshed_at?: number // Last refresh time (optional for debugging)
}

export interface MiddlewareResult {
  response?: NextResponse
  user?: AuthUser | null
  session?: Session | null
  allowed?: boolean
  redirect?: string
  error?: Error
}

export interface RequestContext {
  requestId: string
  timestamp: string
  logger: Logger
}
