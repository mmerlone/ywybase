type Context = Record<string, unknown> | null

function baseLog(level: 'info' | 'warn' | 'error' | 'debug', ctx: Context, message: string): void {
  const payload = {
    level,
    message,
    context: ctx ?? undefined,
    ts: new Date().toISOString(),
  }
  // Cloudflare captures console output; use JSON for structured logs
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(payload))
}

/** Simple structured logger for the worker.
 * Logs JSON lines to console (captured by Cloudflare).
 */
export const logger = {
  info(ctx: Context, message: string): void {
    baseLog('info', ctx, message)
  },
  warn(ctx: Context, message: string): void {
    baseLog('warn', ctx, message)
  },
  error(ctx: Context, message: string): void {
    baseLog('error', ctx, message)
  },
  debug(ctx: Context, message: string): void {
    baseLog('debug', ctx, message)
  },
}

export default logger
