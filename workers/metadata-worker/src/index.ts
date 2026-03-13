// Removed rate-limiting imports
import { validateUrl } from './validators'
import { fetchHtml, FetchError } from './fetchHtml'
import { extractMetadata } from './extract'
import { logger } from './log'

const CACHE_TTL_SECONDS = 24 * 60 * 60 // 24 hours

const METADATA_CACHE_NAME = 'metadata'

/**
 * Helper to safely call cache.put with runtime check.
 * Uses the Cache interface from the Service Worker API.
 */
async function putToCache(cache: Cache, cacheKey: Request, resp: Response, parsed: URL): Promise<void> {
  if (typeof cache === 'object' && cache !== null && 'put' in cache && typeof cache.put === 'function') {
    await cache.put(cacheKey, resp.clone())
  } else {
    logger.warn({ err: 'Cache.put is not a function or not available', url: parsed.toString() }, 'Cache put failed')
  }
}

/**
 * Cloudflare Worker entrypoint for metadata proxy.
 */
const workerEntrypoint = {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/metadata') {
      const target = url.searchParams.get('url')
      if (!target) {
        return new Response(JSON.stringify({ error: 'Missing url parameter' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }

      // Validate URL
      let parsed: URL | null = null
      try {
        parsed = validateUrl(target)
      } catch (err: unknown) {
        let status = 400
        let message = 'Invalid URL'
        if (typeof err === 'object' && err !== null) {
          if ('status' in err && typeof (err as Record<string, unknown>).status === 'number') {
            status = (err as Record<string, unknown>).status as number
          }
          if ('message' in err && typeof (err as Record<string, unknown>).message === 'string') {
            message = (err as Record<string, unknown>).message as string
          }
        }
        return new Response(JSON.stringify({ error: message }), {
          status,
          headers: { 'content-type': 'application/json' },
        })
      }
      if (!parsed) {
        return new Response(JSON.stringify({ error: 'Invalid URL' }), {
          status: 400,
          headers: { 'content-type': 'application/json' },
        })
      }

      // Cache key: use worker-local key derived from target
      const cacheKey = new Request('https://metadata-worker/cache?url=' + encodeURIComponent(parsed.toString()))
      try {
        // Open a named cache (Cloudflare Workers: caches is available globally)
        const cache = await caches.open(METADATA_CACHE_NAME)
        const cached = await cache.match(cacheKey)
        if (cached instanceof Response) {
          return cached
        }

        // Fetch remote HTML safely
        const html = await fetchHtml(parsed, { timeoutMs: 5000, maxBytes: 1_000_000 })

        // Extract metadata
        const metadata = await extractMetadata(html, parsed)

        const body = JSON.stringify(metadata)
        const resp = new Response(body, {
          status: 200,
          headers: { 'content-type': 'application/json', 'Cache-Control': `public, max-age=${CACHE_TTL_SECONDS}` },
        })

        // Cache the response for TTL seconds
        try {
          await putToCache(cache, cacheKey, resp, parsed)
        } catch (cacheErr: unknown) {
          logger.warn(
            {
              err:
                typeof cacheErr === 'object' &&
                cacheErr !== null &&
                'message' in cacheErr &&
                typeof (cacheErr as Record<string, unknown>).message === 'string'
                  ? (cacheErr as Record<string, unknown>).message
                  : typeof cacheErr === 'string'
                    ? cacheErr
                    : JSON.stringify(cacheErr),
              url: parsed.toString(),
            },
            'Cache put failed'
          )
        }

        return resp
      } catch (err) {
        if (err instanceof FetchError) {
          logger.warn({ err: err.message, status: err.status, url: parsed?.toString?.() }, 'Upstream fetch error')
          return new Response(JSON.stringify({ error: err.message }), {
            status: err.status ?? 500,
            headers: { 'content-type': 'application/json' },
          })
        }
        const message =
          typeof err === 'object' && err && 'message' in err
            ? ((err as { message?: string }).message ?? 'Internal error')
            : 'Internal error'
        logger.error({ err: String(err), url: parsed?.toString?.() }, 'Internal error while processing metadata')
        return new Response(JSON.stringify({ error: message }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        })
      }
    }

    return new Response('Not Found', { status: 404 })
  },
}

export default workerEntrypoint
