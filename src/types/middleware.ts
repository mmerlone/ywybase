/**
 * Middleware Types
 *
 * Type definitions for Next.js middleware chain implementation.
 * Provides types for middleware handlers, responses, and configuration.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Valid response types that middleware can return.
 * Allows both NextResponse and standard Response objects.
 */
export type MiddlewareResponse = NextResponse | Response

/**
 * Middleware handler function signature.
 * Can be either synchronous or asynchronous, but must return a response.
 *
 * @param request - The incoming Next.js request object
 * @param response - The Next.js response object to modify
 * @returns A response object (NextResponse or Response) or a Promise resolving to one
 *
 * @example
 * ```typescript
 * const authMiddleware: MiddlewareHandler = async (request, response) => {
 *   // Check authentication
 *   if (!isAuthenticated(request)) {
 *     return NextResponse.redirect(new URL('/login', request.url));
 *   }
 *   return response;
 * };
 * ```
 */
export type MiddlewareHandler = (
  request: NextRequest,
  response: NextResponse
) => MiddlewareResponse | Promise<MiddlewareResponse>

/**
 * Middleware configuration object.
 * Defines metadata and behavior for a middleware in the chain.
 *
 * @example
 * ```typescript
 * const authMiddleware: Middleware = {
 *   name: 'authentication',
 *   handler: authHandler,
 *   requiresResponse: true
 * };
 * ```
 */
export interface Middleware {
  /** Unique identifier for this middleware (for logging and debugging) */
  name: string
  /** The middleware handler function */
  handler: MiddlewareHandler
  /** Whether this middleware requires a response to be passed through the chain */
  requiresResponse?: boolean
}
