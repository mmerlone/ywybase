# Rate Limiting Configuration

This guide covers setting up rate limiting for production deployments with multiple instances.

## Overview

The rate limiting system protects against:

- Brute force attacks
- API abuse
- DDoS attempts
- Resource exhaustion

## Quick Start (New Developer Setup)

> **Why**: The app falls back to in-memory rate limiting without Redis, which means
> limits are not shared across Vercel instances in production.

### 1. Install the Vercel CLI

```bash
pnpm i -g vercel
```

### 2. Link the local project to Vercel

Run once per machine:

```bash
vercel link
```

Follow the prompts to select your scope and project. This creates a `.vercel/`
directory (already in `.gitignore`).

### 3. Pull environment variables

```bash
vercel env pull
```

This writes (or overwrites) `.env.local` with all variables configured in the
Vercel dashboard, including the Upstash Redis credentials.

### 4. Verify the Redis vars are present

After pulling, your `.env.local` should contain:

```env
KV_REST_API_URL=https://your-endpoint.upstash.io
KV_REST_API_TOKEN=AX...
KV_REST_API_READ_ONLY_TOKEN=Ar...
```

If they are missing, the Upstash Redis integration has not yet been installed on
the Vercel project (see [Production Setup](#production-setup) below).

---

## Storage Backends

### Development (In-Memory)

**Automatic Configuration**

- No setup required for local development once `vercel env pull` has been run
- Falls back to `MemoryRateLimitStore` when `KV_REST_API_URL` is absent
- Data is lost on server restart
- Not suitable for production with multiple instances

### Production Setup

#### Upstash Redis (Required for multi-instance deployments)

**One-time integration setup (project owner only):**

1. Go to [Vercel Marketplace → Upstash Redis](https://vercel.com/marketplace?category=storage&search=redis)
2. Click **Add Integration** and follow the wizard to connect to your Vercel project
3. The integration creates an Upstash Redis database and automatically injects the
   following environment variables into every environment (Production, Preview, Development):

   | Variable                      | Purpose                                                        |
   | ----------------------------- | -------------------------------------------------------------- |
   | `KV_REST_API_URL`             | REST endpoint — used by `@upstash/redis`                       |
   | `KV_REST_API_TOKEN`           | Full-access token (read + write) — **server-side only**        |
   | `KV_REST_API_READ_ONLY_TOKEN` | Read-only token                                                |
   | `KV_URL`                      | `rediss://` connection string — for TCP clients, not used here |
   | `REDIS_URL`                   | Alias for `KV_URL` — not used here                             |

4. Each team member runs `vercel env pull` once to get a local copy.

**How the implementation uses these variables:**

`@upstash/redis` communicates over HTTPS (REST), not TCP. This makes it compatible
with Next.js Edge Runtime (used by middleware) and serverless functions. The SDK is
initialized explicitly with the injected vars:

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})
```

> **Note**: `KV_URL` / `REDIS_URL` are `rediss://` TCP connection strings intended for
> clients like `ioredis`. They cannot be used in Edge Runtime and are **not used by
> this project**.

**Benefits:**

- Managed service (no maintenance)
- Automatic scaling
- Built-in monitoring
- HTTP-based — works in Edge Runtime and serverless functions
- **Already included** in project dependencies (`@upstash/redis`)

No other Redis providers are supported. If `KV_REST_API_URL` / `KV_REST_API_TOKEN`
are absent, the application falls back to in-memory rate limiting (suitable for
local development and single-instance use only).

## Configuration Validation

The system automatically validates your rate limiting setup:

```typescript
import { validateRateLimitConfig } from '@/middleware/security/rate-limit'
import { logger } from '@/lib/logger/server'

const validation = validateRateLimitConfig()
if (!validation.isValid) {
  logger.error({ issues: validation.issues }, 'Rate limiting configuration invalid')
}
```

**Production Warnings:**

- Warns if using in-memory storage in production
- Validates that persistent storage is configured
- Checks rate limit configuration values

## Usage Examples

### Middleware Integration

```typescript
// src/middleware.ts
import { rateLimiters } from '@/middleware/security/rate-limit'

export async function middleware(request: NextRequest) {
  // Apply rate limiting to auth endpoints
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    const response = await rateLimiters.auth(request)
    if (response.status === 429) return response
  }

  // Apply general API rate limiting
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = await rateLimiters.api(request)
    if (response.status === 429) return response
  }
}
```

### API Route Protection

```typescript
// app/api/auth/login/route.ts
import { withRateLimit } from '@/middleware/security/rate-limit'

export const POST = withRateLimit('auth', async (request: NextRequest) => {
  // Your login logic here
  // Rate limiting is automatically applied
})
```

### Custom Rate Limiting

```typescript
import { createRateLimiter } from '@/middleware/security/rate-limit'

// Create custom rate limiter
const customLimiter = createRateLimiter('api', {
  max: 50, // 50 requests
  windowMs: 60000, // per minute
  message: 'Too many requests, please try again later',
})

export const POST = async (request: NextRequest) => {
  const response = await customLimiter(request)
  if (response.status === 429) return response

  // Your API logic
}
```

## Monitoring and Debugging

### Rate Limit Headers

Responses include rate limiting information:

```
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 2024-01-01T12:00:00.000Z
Retry-After: 300
```

### Logging

Rate limiting events are automatically logged:

```typescript
// Successful requests
logger.debug({ method, pathname }, 'Rate limit check passed')

// Rate limit exceeded
logger.warn(
  {
    key: 'rate-limit-auth:192.168.1.1',
    count: 6,
    limit: 5,
    resetTime: 1704110400000,
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    path: '/api/auth/login',
  },
  'Rate limit exceeded'
)
```

### Status Checking

```typescript
import { getRateLimitStatus } from '@/middleware/security/rate-limit'
import { logger } from '@/lib/logger/server'

const status = await getRateLimitStatus(request, 'auth')
logger.info(
  {
    success: status.success,
    remaining: status.remaining,
    resetTime: new Date(status.resetTime),
  },
  'Rate limit status checked'
)
```

## Troubleshooting

### Common Issues

**1. In-Memory Storage in Production**

```
Warning: Using in-memory rate limiting in production.
This is not recommended for multi-instance deployments.
```

**Solution**: Install the Upstash Redis integration and run `vercel env pull` to get `KV_REST_API_URL` and `KV_REST_API_TOKEN` (see [Quick Start](#quick-start-new-developer-setup))

**2. Connection Errors**

```
Error connecting to Redis/KV store
```

**Solution**: Verify environment variables and network connectivity

**3. Rate Limits Not Shared**

- **Symptom**: Rate limits reset between requests
- **Cause**: Using in-memory storage with multiple instances
- **Solution**: Configure persistent storage

### Testing Rate Limits

```bash
# Test rate limiting with curl
for i in {1..10}; do
  curl -i http://localhost:3000/api/auth/login \
    -X POST \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
  echo "Request $i completed"
done
```

## Best Practices

1. **Use Persistent Storage in Production**
   - Always configure Upstash Redis for production
   - In-memory storage is only for development

2. **Configure Appropriate Limits**
   - Auth endpoints: 5-10 attempts per 15 minutes
   - API endpoints: 100-1000 requests per 15 minutes
   - Upload endpoints: 10-50 uploads per hour

3. **Monitor Rate Limiting**
   - Set up alerts for high rate limit violations
   - Monitor legitimate users being blocked
   - Adjust limits based on usage patterns

4. **Implement Graceful Degradation**
   - Rate limiting fails open (allows requests) on errors
   - Log errors for debugging
   - Consider circuit breaker patterns

5. **Use Custom Key Generators**
   ```typescript
   const customLimiter = createRateLimiter('api', {
     keyGenerator: (request) => {
       // Use user ID instead of IP for authenticated requests
       const userId = getUserId(request)
       return userId || getIP(request)
     },
   })
   ```

## Related Documentation

- [Security Documentation](./security.md) - Complete security guide
- [API Documentation](./api.md) - API security implementation
- [Deployment Guide](../README.md#deployment) - Production deployment

---

**Last Updated**: March 11, 2026
**Version**: 1.0.0
