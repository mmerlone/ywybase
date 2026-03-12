# API Development Guidelines

This guide provides comprehensive patterns and best practices for developing API endpoints and Server Actions in the YwyBase application.

## Architecture Overview

The application uses a hybrid approach:

- **Server Actions**: Primary data operations (recommended)
- **API Routes**: HTTP endpoints for external integrations
- **Centralized Error Handling**: Consistent error responses
- **Security First**: Built-in protection and validation

## When to Use Server Actions vs API Routes

### Use Server Actions For:

- **Data Mutations**: Create, update, delete operations
- **Authenticated Operations**: User-specific data access
- **Form Submissions**: Handling form data with validation
- **Internal Operations**: Component-to-server communication

### Use API Routes For:

- **External Integrations**: Webhooks, third-party APIs
- **File Uploads**: Direct file handling
- **Webhook Handlers**: Processing external events
- **Public Endpoints**: Open access points

## Server Actions Development

### Basic Structure

All Server Actions follow this pattern:

```typescript
'use server'

import { withServerActionErrorHandling } from '@/lib/error/server'
import { createServerActionSuccess } from '@/lib/error/server'
import type { AuthResponse } from '@/types/error.types'

export const yourAction = withServerActionErrorHandling(
  async (param1: string, param2: number): Promise<AuthResponse<YourType>> => {
    // Your implementation here
    const result = await performOperation(param1, param2)

    return createServerActionSuccess(result, 'Operation completed')
  },
  { operation: 'yourAction' }
)
```

### Input Validation

Always validate inputs with Zod schemas:

```typescript
import { z } from 'zod'

const yourSchema = z.object({
  email: z.string().email(),
  count: z.number().min(1).max(100),
})

export const yourAction = withServerActionErrorHandling(
  async (data: unknown): Promise<AuthResponse<YourType>> => {
    const validated = yourSchema.safeParse(data)
    if (!validated.success) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'Invalid input provided',
        context: validated.error.errors,
      })
    }

    // Use validated.data
    return createServerActionSuccess(processData(validated.data))
  },
  { operation: 'yourAction' }
)
```

### Database Operations

Use the Supabase client with proper error handling:

```typescript
import { createClient } from '@/lib/supabase/server'

export const getProfile = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile>> => {
    const supabase = await createClient()

    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) throw error
    return createServerActionSuccess(data)
  },
  { operation: 'getProfile' }
)
```

### Logging

Always include structured logging:

```typescript
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('your-module')

export const yourAction = withServerActionErrorHandling(
  async (userId: string, data: YourData): Promise<AuthResponse<YourType>> => {
    logger.info({ userId, action: 'yourAction' }, 'Starting operation')

    try {
      const result = await processOperation(userId, data)
      logger.info({ userId, resultId: result.id }, 'Operation completed')
      return createServerActionSuccess(result)
    } catch (error) {
      logger.error({ userId, error }, 'Operation failed')
      throw error
    }
  },
  { operation: 'yourAction' }
)
```

## API Routes Development

### Basic Structure

All API routes use the same wrapper pattern:

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'

export const GET = withRateLimit(
  'api', // rate limit profile key — see table below
  withApiErrorHandler(async (request: NextRequest) => {
    // Your implementation here
    return NextResponse.json({ success: true, data: result })
  })
)
```

**Choosing a rate limit profile** — valid keys are defined in `src/config/security.ts`:

| Key                 | Use for                                  | Production limit |
| ------------------- | ---------------------------------------- | ---------------- |
| `api`               | General public endpoints                 | 100 req / 15 min |
| `emailVerification` | Email link handlers (PKCE flows)         | 10 req / hr      |
| `passwordReset`     | Password reset initiation                | 3 req / hr       |
| `upload`            | File upload endpoints                    | 10 req / hr      |
| `auth`              | Reserved for middleware-level auth paths | 5 req / 15 min   |

Use `'api'` for most new routes. Choose a more restrictive profile for sensitive endpoints (auth flows, file uploads).

### Request Processing

Extract and validate request data:

```typescript
export const POST = withRateLimit(
  'api',
  withApiErrorHandler(async (request: NextRequest) => {
    // Parse JSON body
    const body = await request.json()

    // Validate with Zod
    const validated = yourSchema.safeParse(body)
    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: validated.error.errors },
        { status: 400 }
      )
    }

    // Process request
    const result = await processRequest(validated.data)
    return NextResponse.json({ success: true, data: result })
  })
)
```

### URL Parameters

Handle query parameters and path parameters:

```typescript
export const GET = withRateLimit(
  'api',
  withApiErrorHandler(async (request: NextRequest) => {
    // Query parameters
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 100)
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10) || 0, 0)

    // Path parameters (from route pattern)
    // Example: /api/users/[userId]/profile
    // const userId = params.userId

    const results = await getData(limit, offset)
    return NextResponse.json({ success: true, data: results })
  })
)
```

### Response Headers

Add appropriate headers for different response types:

```typescript
export const GET = withRateLimit(
  'api',
  withApiErrorHandler(async (request: NextRequest) => {
    const data = await getData()

    return new NextResponse(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // 1 hour cache
      },
    })
  })
)
```

## Error Handling Patterns

### Server Actions

Server Actions automatically handle errors through the wrapper:

```typescript
export const yourAction = withServerActionErrorHandling(
  async (param: string): Promise<AuthResponse<YourType>> => {
    // Business logic errors
    if (!isValid(param)) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'Invalid parameter provided',
        context: { param },
      })
    }

    // Database errors
    try {
      const result = await databaseOperation(param)
      return createServerActionSuccess(result)
    } catch (error) {
      // Logged and handled automatically
      throw error
    }
  },
  { operation: 'yourAction' }
)
```

### API Routes

API routes use the error handler wrapper:

```typescript
export const POST = withRateLimit(
  'your-operation',
  withApiErrorHandler(async (request: NextRequest) => {
    // Validation errors
    const body = await request.json()
    if (!body.email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 })
    }

    // Business logic errors
    if (await emailExists(body.email)) {
      return NextResponse.json({ success: false, error: 'Email already exists' }, { status: 409 })
    }

    // Success
    const result = await createUser(body)
    return NextResponse.json({ success: true, data: result })
  })
)
```

## Security Best Practices

### Input Validation

Always validate all inputs:

```typescript
import { z } from 'zod'

const userSchema = z.object({
  email: z.string().email().max(255),
  name: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z\s]+$/),
  age: z.number().min(13).max(120),
})

// In Server Actions
const validated = userSchema.safeParse(input)
if (!validated.success) {
  throw new BusinessError({
    code: ErrorCodes.validation.invalidInput(),
    message: 'Invalid user data',
    context: validated.error.errors,
  })
}

// In API Routes
const validated = userSchema.safeParse(body)
if (!validated.success) {
  return NextResponse.json({ success: false, error: 'Invalid input', details: validated.error.errors }, { status: 400 })
}
```

### Rate Limiting

Apply rate limiting to sensitive operations:

```typescript
export const POST = withRateLimit(
  'auth', // or 'emailVerification' / 'passwordReset' for auth flows
  withApiErrorHandler(async (request: NextRequest) => {
    // Your implementation
  })
)
```

### Authentication Checks

Verify user authentication for protected operations:

```typescript
import { createClient } from '@/lib/supabase/server'

export const getProtectedData = withServerActionErrorHandling(
  async (): Promise<AuthResponse<ProtectedData>> => {
    const supabase = await createClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error || !user) {
      throw new AuthenticationError('User not authenticated')
    }

    // User is authenticated, proceed
    const data = await getUserData(user.id)
    return createServerActionSuccess(data)
  },
  { operation: 'getProtectedData' }
)
```

## Testing Strategies

### Unit Testing Server Actions

```typescript
import { describe, it, expect, vi } from 'vitest'
import { getProfile } from '@/lib/actions/profile'

// Mock dependencies
vi.mock('@/lib/supabase/server')
vi.mock('@/lib/logger/server')

describe('getProfile', () => {
  it('should return profile data for valid user', async () => {
    const mockProfile = { id: '123', display_name: 'Test User' }
    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }),
        }),
      }),
    }

    // Mock createClient to return our mock
    const { createClient } = await import('@/lib/supabase/server')
    vi.mocked(createClient).mockResolvedValue(mockSupabase)

    const result = await getProfile('123')

    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockProfile)
  })
})
```

### Integration Testing API Routes

```typescript
import { describe, it, expect } from 'vitest'
import { GET } from '@/app/api/users/route'

describe('/api/users', () => {
  it('should return users list', async () => {
    const request = new Request('http://localhost:3000/api/users')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
  })
})
```

## Performance Optimization

### Database Queries

Use efficient queries and select only needed fields:

```typescript
// ✅ Good - Select specific fields
const { data } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('active', true).limit(10)

// ❌ Avoid - Select all fields
const { data } = await supabase.from('profiles').select('*')
```

### Caching

Implement caching for frequently accessed data:

```typescript
import { cache } from 'react'

export const getPopularPosts = cache(async (): Promise<Post[]> => {
  const supabase = await createClient()
  const { data } = await supabase
    .from('posts')
    .select('*')
    .eq('published', true)
    .order('views', { ascending: false })
    .limit(10)

  return data || []
})
```

### Response Optimization

Add appropriate caching headers:

```typescript
export const GET = withRateLimit(
  'api',
  withApiErrorHandler(async (request: NextRequest) => {
    const data = await getStaticData()

    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
          Vary: 'Accept-Encoding',
        },
      }
    )
  })
)
```

## Monitoring and Observability

### Logging

Always include structured context in logs:

```typescript
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('api-operation')

export const yourAction = withServerActionErrorHandling(
  async (userId: string, data: YourData): Promise<AuthResponse<YourType>> => {
    const startTime = Date.now()
    const operationId = crypto.randomUUID()

    logger.info(
      {
        userId,
        operationId,
        action: 'yourAction',
        dataSize: JSON.stringify(data).length,
      },
      'Starting operation'
    )

    try {
      const result = await processOperation(data)

      logger.info(
        {
          userId,
          operationId,
          action: 'yourAction',
          duration: Date.now() - startTime,
          resultSize: result ? 1 : 0,
        },
        'Operation completed successfully'
      )

      return createServerActionSuccess(result)
    } catch (error) {
      logger.error(
        {
          userId,
          operationId,
          action: 'yourAction',
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : String(error),
        },
        'Operation failed'
      )

      throw error
    }
  },
  { operation: 'yourAction' }
)
```

### Error Tracking

Use Sentry for error monitoring:

```typescript
import * as Sentry from '@sentry/nextjs'

export const yourAction = withServerActionErrorHandling(
  async (data: YourData): Promise<AuthResponse<YourType>> => {
    try {
      const result = await processOperation(data)
      return createServerActionSuccess(result)
    } catch (error) {
      // Capture additional context
      Sentry.withScope((scope) => {
        scope.setTag('operation', 'yourAction')
        scope.setContext('requestData', {
          dataType: data.constructor.name,
          dataSize: JSON.stringify(data).length,
        })
        Sentry.captureException(error)
      })

      throw error
    }
  },
  { operation: 'yourAction' }
)
```

## File Organization

### Server Actions Structure

```
src/lib/actions/
├── auth/
│   ├── server.ts          # Authentication actions
│   ├── client-signup.ts   # Client-side signup
│   └── README.md          # Auth documentation
├── profile.ts             # Profile management
├── location.ts            # Location services
└── README.md              # Actions overview
```

### API Routes Structure

```
app/api/
├── auth/
│   ├── confirm/route.ts        # Email confirmation (PKCE)
│   └── reset-password/route.ts # Password reset (PKCE)
├── og/
│   ├── route.tsx               # Default OG image (Node.js runtime)
│   └── profile/route.tsx       # Profile OG image (Node.js runtime)
├── social-metadata/route.ts
└── sentry-example-api/route.ts
```

## Related Documentation

- [Server Actions Reference](/docs/user-guides/server-actions.md) - Complete API reference
- [API Endpoints Reference](/docs/user-guides/api-reference.md) - HTTP endpoint documentation
- [Error Handling](/src/lib/error/README.md) - Centralized error handling
- [Security Documentation](/docs/security.md) - Security best practices
- [Logging System](/src/lib/logger/README.md) - Logging patterns

---

**Last Updated**: March 11, 2026
