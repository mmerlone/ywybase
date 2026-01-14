# Rate Limiting Configuration

This guide covers setting up rate limiting for production deployments with multiple instances.

## Overview

The rate limiting system protects against:

- Brute force attacks
- API abuse
- DDoS attempts
- Resource exhaustion

## Storage Backends

### Development (In-Memory)

**Automatic Configuration**

- No setup required for local development
- Uses `MemoryRateLimitStore` automatically
- Data is lost on server restart
- Not suitable for production with multiple instances

### Production Options

#### Option 1: Vercel KV (Recommended for Vercel)

**Setup Steps:**

1. **Create Vercel KV Database**
   - Go to [Vercel Dashboard → Storage](https://vercel.com/dashboard/stores)
   - Click "Create Database" → "KV"
   - Choose a name and region
   - Click "Create"

2. **Get Connection Details**
   - Copy the `KV_REST_API_URL` and `KV_REST_API_TOKEN`
   - Add to your environment variables

3. **Environment Variables**
   ```env
   KV_REST_API_URL=https://your-kv-database.kv.vercel-storage.com
   KV_REST_API_TOKEN=your_kv_rest_api_token
   ```

**Benefits:**

- Managed service (no maintenance)
- Automatic scaling
- Built-in monitoring
- Optimized for Vercel deployments
- **Already included** in project dependencies

#### Option 2: Redis (Other Deployments)

**Setup Steps:**

1. **Install Redis Client**

   ```bash
   # Choose one:
   pnpm add ioredis    # Recommended
   pnpm add redis      # Alternative
   ```

   **Note**: Redis packages are optional and only loaded when needed. The application will work without them but will fall back to in-memory storage.

2. **Environment Variables**

   ```env
   # Option A: Connection URL
   REDIS_URL=redis://username:password@host:port

   # Option B: Individual settings
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   ```

**Redis Providers:**

- **Upstash**: Serverless Redis with REST API
- **Redis Cloud**: Managed Redis service
- **AWS ElastiCache**: AWS managed Redis
- **Self-hosted**: Your own Redis instance

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

**Solution**: Configure Redis or Vercel KV

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
   - Always configure Redis or Vercel KV for production
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

**Last Updated**: December 21, 2025  
**Version**: 1.0.0
