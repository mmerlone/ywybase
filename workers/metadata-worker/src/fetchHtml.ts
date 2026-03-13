/**
 * Error thrown when fetching the target URL fails or returns an unacceptable
 * response (timeout, non-OK status, or response size limit exceeded).
 */
export class FetchError extends Error {
  status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'FetchError'
    this.status = status
  }
}

/**
 * Fetch HTML from a remote URL with conservative resource limits.
 * - `timeoutMs` aborts the request after the given number of milliseconds.
 * - `maxBytes` limits the number of bytes read from the response body.
 *
 * Returns the full HTML text up to `maxBytes` or throws `FetchError`.
 */
export async function fetchHtml(url: URL, opts?: { timeoutMs?: number; maxBytes?: number }): Promise<string> {
  const timeoutMs = opts?.timeoutMs ?? 5000
  const maxBytes = opts?.maxBytes ?? 1_000_000 // 1 MB

  const controller = new AbortController()
  // Use ReturnType<typeof setTimeout> for type safety
  const id = globalThis.setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkPreviewBot/1.0)',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      redirect: 'follow',
      signal: controller.signal,
    })

    // Validate the final resolved URL after redirects to prevent SSRF via redirects
    let validators: { validateUrl: (url: string) => void } | null = null
    try {
      // Import validator locally to avoid potential circular import at module load
      validators = await import('./validators')
    } catch {
      // If dynamic import fails or validator not present, continue without extra validation
    }

    if (validators) {
      try {
        validators.validateUrl(response.url)
      } catch (vErr: unknown) {
        // If validator throws ValidationError-like object, convert to FetchError with same status when available
        if (vErr && typeof vErr === 'object' && 'status' in vErr) {
          const status = (vErr as { status?: number }).status ?? 403
          throw new FetchError('Blocked host (redirected)', status)
        }
        throw new FetchError('Blocked host (redirected)', 403)
      }
    }

    if (!response.ok) {
      // Log upstream non-OK responses
      try {
        const { logger } = await import('./log')
        logger.warn({ status: response.status, url: url.toString() }, 'Upstream responded with non-OK status')
      } catch {}
      throw new FetchError(`Upstream responded ${response.status}`, response.status)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      // Fallback: use text() when stream not available
      const text = await response.text()
      if (text.length > maxBytes) throw new FetchError('Response exceeds maximum allowed size', 413)
      return text
    }

    const decoder = new TextDecoder('utf-8')
    const chunks: Uint8Array[] = []
    let received = 0

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (value) {
        received += value.length
        if (received > maxBytes) {
          // Cancel reader and throw
          try {
            controller.abort()
          } catch {}
          throw new FetchError('Response exceeds maximum allowed size', 413)
        }
        chunks.push(value)
      }
    }

    // Concatenate
    let totalLen = 0
    for (const c of chunks) totalLen += c.length
    const merged = new Uint8Array(totalLen)
    let offset = 0
    for (const c of chunks) {
      merged.set(c, offset)
      offset += c.length
    }

    return decoder.decode(merged)
  } catch (err) {
    if (err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'AbortError') {
      try {
        const { logger } = await import('./log')
        logger.warn({ url: url.toString() }, 'Fetch timed out')
      } catch {}
      throw new FetchError('Fetch timed out', 408)
    }
    if (err instanceof FetchError) throw err
    try {
      const { logger } = await import('./log')
      logger.error({ err: String(err), url: url.toString() }, 'Fetch failed')
    } catch {}
    throw new FetchError(
      typeof err === 'object' && err && 'message' in err
        ? String((err as { message?: string }).message)
        : 'Fetch failed',
      500
    )
  } finally {
    globalThis.clearTimeout(id)
  }
}
