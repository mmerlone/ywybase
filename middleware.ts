/**
 * Next.js middleware entry point (root-level).
 *
 * Re-export implementation from src/middleware.ts so Next.js can detect it.
 *
 * NOTE: `config` must be an inline static literal here — Next.js statically
 * analyzes this file at build time and cannot resolve re-exported variables.
 */
import { middleware as appMiddleware } from './src/middleware/index'

export const middleware = appMiddleware

/**
 * Configure which routes the middleware should run on.
 * Match all request paths except static files, image optimization, favicon, public folder, and healthcheck.
 */
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/|healthcheck).*)'],
}
