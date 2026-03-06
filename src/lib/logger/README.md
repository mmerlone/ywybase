# Logger System

A production-ready logging system built with Pino for server-side logging and console-based logging for client-side development. The system provides structured logging with context-first patterns and environment-specific optimizations.

## 🚀 **Quick Start**

```typescript
// Server-side logging
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('user-service')
logger.info({ userId: '123' }, 'User profile updated')

// Client-side logging (development only)
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('user-component')
logger.debug({ action: 'button-click' }, 'User clicked save button')

// Environment-agnostic imports (NOT RECOMMENDED - see note below)
import { serverLogger, clientLogger } from '@/lib/logger'

// ❌ DANGEROUS: This will crash in client components due to webpack externals
const logger = typeof window === 'undefined' ? serverLogger : clientLogger

// ✅ RECOMMENDED: Use explicit imports based on component type
// For server components:
import { buildLogger } from '@/lib/logger/server'
const logger = buildLogger('server-component')

// For client components:
import { buildLogger } from '@/lib/logger/client'
const logger = buildLogger('client-component')
```

## Overview

This logging system provides:

- **Server-Side Logging** - Production-ready Pino logger with structured output
- **Client-Side Logging** - Development console logging that mirrors Pino API
- **Context-First Pattern** - Consistent logging pattern across the application
- **Environment Optimization** - Different behaviors for development vs production
- **Type Safety** - Full TypeScript integration with structured context
- **Performance** - Optimized for both development and production environments

## Architecture

```
src/lib/logger/
├── index.ts           # Main exports and environment detection
├── client.ts          # Browser-side console logger
├── server.ts          # Server-side Pino logger
└── README.md          # This documentation
```

## Core Concepts

### 1. Context-First Logging Pattern

**Always** use the context-first pattern for consistent structured logging:

```typescript
// ✅ Correct - Context first, message second
logger.info({ userId: '123', action: 'login' }, 'User logged in successfully')

// ❌ Incorrect - Will cause TypeScript errors
logger.info('User logged in successfully', { userId: '123', action: 'login' })
```

### 2. Environment-Specific Behavior

#### Server-Side (Pino)

- **Production**: JSON structured logs, info level and above
- **Development**: Pretty-printed logs with colors, debug level and above

#### Client-Side (Console)

- **Production**: No-op logger (no console output)
- **Development**: Console-based logging that mirrors Pino API

### 3. Module-Specific Loggers

Create module-specific loggers for better traceability:

```typescript
// Create a logger for a specific module
const logger = buildLogger('auth-service')

// All logs from this logger will include { module: 'auth-service' }
logger.info({ userId: '123' }, 'Authentication successful')
// Output: { module: 'auth-service', userId: '123' } Authentication successful
```

## API Reference

### Server Logger (`server.ts`)

#### buildLogger(moduleName)

Creates a server-side Pino logger with module context.

```typescript
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('profile-service')
```

**Parameters**:

- `moduleName` - String identifier for the module/service

**Returns**: `Logger` - Pino logger instance with module context

#### logger

Direct access to the base Pino logger instance.

```typescript
import { logger } from '@/lib/logger/server'

logger.info({ requestId: 'abc123' }, 'Processing request')
```

### Client Logger (`client.ts`)

#### buildLogger(moduleName)

Creates a client-side console logger with module context.

```typescript
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('user-component')
```

**Parameters**:

- `moduleName` - String identifier for the component/module

**Returns**: `Logger` - Console-based logger that mirrors Pino API

#### logger

Direct access to the base client logger instance.

```typescript
import { logger } from '@/lib/logger/client'

logger.debug({ component: 'LoginForm' }, 'Form validation passed')
```

### Main Exports (`index.ts`)

#### Environment-Specific Loggers

```typescript
import {
  clientLogger, // Client-side logger
  serverLogger, // Server-side logger
  buildClientLogger, // Client logger builder
  buildServerLogger, // Server logger builder
} from '@/lib/logger'
```

#### Environment Detection Helpers

```typescript
import {
  clientLogger, // Client-side logger
  serverLogger, // Server-side logger
  buildClientLogger, // Client logger builder
  buildServerLogger, // Server logger builder
  isClient, // Environment detection helper
  isServer, // Environment detection helper
} from '@/lib/logger'

// ❌ DANGEROUS: Don't use runtime environment detection with loggers
// This will crash due to webpack externals configuration
if (isServer()) {
  const logger = buildServerLogger('api-handler') // Will crash in client bundle
}

// ✅ RECOMMENDED: Use explicit imports based on component type
// In server components/API routes:
import { buildLogger } from '@/lib/logger/server'
const logger = buildLogger('server-module')

// In client components:
import { buildLogger } from '@/lib/logger/client'
const logger = buildLogger('client-module')
```

**⚠️ Important**: Due to webpack externals configuration in `next.config.mjs`, server logger modules are excluded from client bundles. Runtime environment detection with loggers will cause crashes. Always use explicit imports based on your component type.

### Logger Interface

All loggers implement the same interface for consistency:

```typescript
interface Logger {
  error: (context: LoggerContext, message: string) => void
  warn: (context: LoggerContext, message: string) => void
  info: (context: LoggerContext, message: string) => void
  debug: (context: LoggerContext, message: string) => void
  child: (context: LoggerContext) => Logger
}

interface LoggerContext {
  [key: string]: unknown
}
```

## Usage Patterns

### Server Components

```typescript
// app/dashboard/page.tsx
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('dashboard-page')

export default async function DashboardPage() {
  try {
    logger.info({ page: 'dashboard' }, 'Loading dashboard page')

    const data = await fetchDashboardData()

    logger.debug({ dataCount: data.length }, 'Dashboard data loaded')

    return <DashboardView data={data} />
  } catch (error) {
    logger.error({ error }, 'Failed to load dashboard')
    throw error
  }
}
```

### API Routes

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('users-api')

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  logger.info({ requestId, method: 'GET', path: '/api/users' }, 'API request received')

  try {
    const users = await getUsers()

    logger.info({ requestId, userCount: users.length }, 'Users retrieved successfully')

    return NextResponse.json({ users })
  } catch (error) {
    logger.error({ requestId, error }, 'Failed to retrieve users')

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Server Actions

```typescript
// app/actions/profile.ts
'use server'

import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('profile-actions')

export async function updateProfile(userId: string, data: ProfileData) {
  logger.info({ userId, action: 'updateProfile' }, 'Updating user profile')

  try {
    const updatedProfile = await profileService.update(userId, data)

    logger.info({ userId, profileId: updatedProfile.id }, 'Profile updated successfully')

    return { success: true, profile: updatedProfile }
  } catch (error) {
    logger.error({ userId, error }, 'Failed to update profile')

    return { success: false, error: 'Update failed' }
  }
}
```

### Client Components

```typescript
// src/components/UserProfile.tsx
'use client'

import { useEffect } from 'react'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('user-profile')

export function UserProfile({ userId }: { userId: string }) {
  useEffect(() => {
    logger.debug({ userId, component: 'UserProfile' }, 'Component mounted')

    return () => {
      logger.debug({ userId, component: 'UserProfile' }, 'Component unmounted')
    }
  }, [userId])

  const handleSave = async () => {
    logger.info({ userId, action: 'save' }, 'User initiated profile save')

    try {
      await saveProfile(userId)
      logger.info({ userId }, 'Profile saved successfully')
    } catch (error) {
      logger.error({ userId, error }, 'Failed to save profile')
    }
  }

  return (
    <div>
      <button onClick={handleSave}>Save Profile</button>
    </div>
  )
}
```

### Server Actions

This project uses Server Actions for server-side data access. Logging patterns are the same regardless of where the data is fetched.

### Middleware

```typescript
// src/middleware/auth-middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('auth-middleware')

export async function authMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  logger.debug({ pathname }, 'Processing auth middleware')

  try {
    const user = await getCurrentUser(request)

    if (!user) {
      logger.warn({ pathname }, 'Unauthenticated access attempt')
      return NextResponse.redirect(new URL('/login', request.url))
    }

    logger.info({ userId: user.id, pathname }, 'Authenticated request processed')

    return NextResponse.next()
  } catch (error) {
    logger.error({ pathname, error }, 'Auth middleware error')
    return NextResponse.redirect(new URL('/error', request.url))
  }
}
```

## Configuration

### Webpack Bundling Configuration

The project uses webpack externals to prevent server-side modules from being bundled in client code. This is configured in `next.config.mjs`:

```javascript
// next.config.mjs
webpack: (config) => {
  if (config.name === 'server') {
    // Server bundles can access all modules
    config.externals.push({
      pino: 'pino',
      'pino-pretty': 'pino-pretty',
      // ... other server modules
    })
  } else {
    // Client bundles exclude server logger modules
    config.externals.push({
      '@/lib/logger/server': 'void 0',
      pino: 'void 0',
      'pino-pretty': 'void 0',
      // ... other server modules set to void 0
    })
  }
  return config
}
```

**⚠️ Critical**: This configuration means:

- ✅ Server components can safely import `@/lib/logger/server`
- ❌ Client components will crash if they try to import `@/lib/logger/server`
- ❌ Runtime environment detection with server logger imports will fail

### Server Logger Configuration

The server logger is configured in `src/lib/logger/server.ts`:

```typescript
const options: LoggerOptions = {
  level: isProduction ? 'info' : 'debug',
}

if (!isProduction) {
  options.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  }
}
```

### Environment Variables

```bash
# Set log level (optional, defaults based on NODE_ENV)
LOG_LEVEL=debug

# Node environment
NODE_ENV=development  # or production
```

### Development vs Production

#### Development

- **Server**: Pretty-printed logs with colors and timestamps
- **Client**: Console logging with formatted output
- **Level**: Debug and above

#### Production

- **Server**: JSON structured logs for log aggregation
- **Client**: No-op logger (no console output)
- **Level**: Info and above

## Child Loggers

Create child loggers for specific contexts:

```typescript
const baseLogger = buildLogger('user-service')

// Create child logger with additional context
const requestLogger = baseLogger.child({ requestId: 'abc123' })

// All logs from requestLogger will include the requestId
requestLogger.info({ action: 'validate' }, 'Validating user input')
// Output: { module: 'user-service', requestId: 'abc123', action: 'validate' } Validating user input

// Create child logger for specific user
const userLogger = baseLogger.child({ userId: '456' })
userLogger.info({ action: 'update' }, 'Updating user profile')
// Output: { module: 'user-service', userId: '456', action: 'update' } Updating user profile
```

## Best Practices

### 1. **Explicit Import Strategy (Critical)**

```typescript
// ✅ ALWAYS use explicit imports based on component type

// In server components, API routes, server actions:
import { buildLogger } from '@/lib/logger/server'
const logger = buildLogger('server-module')

// In client components:
import { buildLogger } from '@/lib/logger/client'
const logger = buildLogger('client-module')

// ❌ NEVER use runtime environment detection with logger imports
// This WILL crash due to webpack externals:
import { serverLogger, clientLogger } from '@/lib/logger'
const logger = typeof window === 'undefined' ? serverLogger : clientLogger // CRASHES
```

### 2. Context-First Pattern

```typescript
// ✅ Always use context-first pattern
logger.info({ userId: '123', action: 'login' }, 'User authentication successful')

// ❌ Never use message-first pattern
logger.info('User authentication successful', { userId: '123', action: 'login' })
```

### 2. Structured Context

```typescript
// ✅ Use structured, meaningful context
logger.error(
  {
    userId: '123',
    operation: 'updateProfile',
    error: error.message,
    duration: Date.now() - startTime,
  },
  'Profile update failed'
)

// ❌ Avoid unstructured or meaningless context
logger.error({ stuff: 'things', data: 'some data' }, 'Something went wrong')
```

### 3. Appropriate Log Levels

```typescript
// ✅ Use appropriate log levels
logger.error({ error }, 'Database connection failed') // Errors that need attention
logger.warn({ userId }, 'User attempted invalid action') // Warnings about unusual behavior
logger.info({ userId }, 'User logged in successfully') // Important business events
logger.debug({ query }, 'Executing database query') // Detailed debugging information
```

### 4. Error Logging

```typescript
// ✅ Include error objects in context
try {
  await riskyOperation()
} catch (error) {
  logger.error(
    {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      operation: 'riskyOperation',
    },
    'Operation failed'
  )
  throw error
}

// ❌ Don't log error messages as strings
logger.error({}, `Error: ${error.message}`)
```

### 5. Performance Considerations

```typescript
// ✅ Use appropriate log levels to avoid performance impact
if (process.env.NODE_ENV === 'development') {
  logger.debug({ largeObject }, 'Debug information')
}

// ✅ Use child loggers for repeated context
const userLogger = logger.child({ userId })
userLogger.info({ action: 'login' }, 'User logged in')
userLogger.info({ action: 'profile_view' }, 'User viewed profile')

// ❌ Avoid expensive operations in log context
logger.info(
  {
    expensiveData: JSON.stringify(largeObject), // Expensive serialization
  },
  'Processing data'
)
```

## Integration Examples

### React Query Integration

```typescript
// src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('use-profile-hook')

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      logger.debug({ userId }, 'Fetching profile data')

      try {
        const profile = await getProfile(userId)
        logger.info({ userId, profileId: profile.id }, 'Profile data loaded')
        return profile
      } catch (error) {
        logger.error({ userId, error }, 'Failed to load profile')
        throw error
      }
    },
    onError: (error) => {
      logger.error({ userId, error }, 'Profile query failed')
    },
    onSuccess: (data) => {
      logger.debug({ userId, profileId: data.id }, 'Profile query succeeded')
    },
  })
}
```

### Error Boundary Integration

```typescript
// src/components/error/GlobalErrorBoundary.tsx
'use client'

import React from 'react'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('global-error-boundary')

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class GlobalErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Enhanced logging with structured error information
    const errorContext = {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    }

    // Add AppError-specific properties if this is an AppError
    if ('code' in error) {
      const appError = error as any
      Object.assign(errorContext, {
        errorCode: appError.code,
        errorContext: appError.context,
        statusCode: appError.statusCode,
        isOperational: appError.isOperational,
      })
    }

    logger.error(errorContext, 'Global Error Boundary caught an error')
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI with Material-UI components
      return (
        <div>
          <h2>Oops! Something went wrong</h2>
          <p>We're sorry, but something unexpected happened.</p>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details>
              <summary>Error Details (Development Only)</summary>
              <pre>{this.state.error.toString()}</pre>
            </details>
          )}
        </div>
      )
    }

    return this.props.children
  }
}
```

### Sentry Integration

The project includes comprehensive Sentry integration for error tracking and performance monitoring. Sentry is configured to automatically capture logs from the Pino logger system.

#### Sentry Configuration Overview

The project uses three Sentry configuration files:

1. **`sentry.server.config.ts`** - Server-side Sentry configuration with Pino integration
2. **`sentry.edge.config.ts`** - Edge runtime configuration for middleware and edge functions
3. **`instrumentation-client.ts`** - Client-side Sentry configuration

#### Automatic Log Integration

**Server-Side (sentry.server.config.ts)**:

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  integrations: [
    Sentry.pinoIntegration({
      log: { levels: ['info', 'warn', 'error'] },
    }),
  ],
})
```

**Edge Runtime (sentry.edge.config.ts)**:

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
  integrations: [
    Sentry.captureConsoleIntegration({
      levels: ['info', 'error', 'warn'],
    }),
  ],
})
```

#### Instrumentation Setup

The project uses Next.js instrumentation to initialize Sentry across different runtimes:

**`instrumentation.ts`**:

```typescript
import * as Sentry from '@sentry/nextjs'

export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config')
  }
}

export const onRequestError = Sentry.captureRequestError
```

**`instrumentation-client.ts`**:

```typescript
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1,
  enableLogs: true,
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
```

This setup ensures that:

- Server-side errors are automatically captured with Pino integration
- Edge runtime errors are captured with console integration
- Client-side errors and performance data are tracked
- Request errors are automatically captured via `onRequestError`
- Router transitions are monitored via `onRouterTransitionStart`

#### Automatic Log Capture

With the Pino integration enabled, all server-side logs at `info`, `warn`, and `error` levels are automatically sent to Sentry:

```typescript
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('user-service')

// This log will automatically be sent to Sentry
logger.error({ userId: '123', operation: 'updateProfile' }, 'Profile update failed')

// This log will also be sent to Sentry
logger.warn({ userId: '123', action: 'suspicious' }, 'User attempted invalid action')

// This log will be sent to Sentry as well
logger.info({ userId: '123', event: 'login' }, 'User logged in successfully')

// Debug logs are NOT sent to Sentry (not in the levels array)
logger.debug({ query: 'SELECT * FROM users' }, 'Executing database query')
```

#### Manual Error Capture with Context

For more control over error reporting, you can manually capture errors with additional context:

```typescript
// Manual Sentry integration example
import * as Sentry from '@sentry/nextjs'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('error-handler')

export function captureErrorWithContext(
  error: Error,
  context: Record<string, unknown>,
  level: 'error' | 'warning' | 'info' = 'error'
) {
  // Log to our structured logger first
  logger.error({ error: error.message, ...context }, 'Error captured for Sentry')

  // Send to Sentry with enhanced context
  Sentry.withScope((scope) => {
    // Set context as tags for filtering
    Object.entries(context).forEach(([key, value]) => {
      scope.setTag(key, String(value))
    })

    // Set additional context data
    scope.setContext('errorContext', context)
    scope.setLevel(level)

    Sentry.captureException(error)
  })
}
```

**Note**: The above helper function is an example pattern. The actual project relies on automatic Sentry integration via the Pino integration configured in `sentry.server.config.ts`.

#### Usage in Service Layer

```typescript
// Server-side example using actual server action implementation
// src/lib/actions/profile/index.ts
import 'server-only'
import { createClient } from '@/lib/supabase/server'
import { withServerActionErrorHandling, createServerActionSuccess } from '@/lib/error/server'
import type { AuthResponse } from '@/types/error.types'
import type { Profile } from '@/types/database'

export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: Partial<Profile>): Promise<AuthResponse<Profile>> => {
    const supabase = await createClient()

    const { data, error } = await supabase.from('profiles').update(updates).eq('id', userId).select().single()

    if (error) throw error
    return createServerActionSuccess(data, 'Profile updated')
  }
)

export const getProfile = withServerActionErrorHandling(async (userId: string): Promise<AuthResponse<Profile>> => {
  const supabase = await createClient()

  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) throw error
  return createServerActionSuccess(data)
})
```

**Note**: This project uses **server actions as the primary pattern** for server-side data operations. Services exist but are not actively used. The `withServerActionErrorHandling` wrapper provides consistent error handling and logging.

#### Client-Side Integration

```typescript
// src/components/UserProfile.tsx
'use client'

import * as Sentry from '@sentry/nextjs'
import { buildLogger } from '@/lib/logger/client'

const logger = buildLogger('user-profile')

export function UserProfile({ userId }: { userId: string }) {
  const handleSave = async () => {
    // Start client-side span for user interaction
    Sentry.startSpan(
      {
        op: 'ui.action',
        name: 'UserProfile.save',
      },
      async (span) => {
        span.setAttribute('userId', userId)
        span.setAttribute('component', 'UserProfile')

        logger.info({ userId, action: 'save' }, 'User initiated profile save')

        try {
          await saveProfile(userId)
          logger.info({ userId }, 'Profile saved successfully')
        } catch (error) {
          logger.error({ userId, error }, 'Failed to save profile')

          // Capture error with user context
          Sentry.withScope((scope) => {
            scope.setTag('userId', userId)
            scope.setTag('component', 'UserProfile')
            scope.setTag('action', 'save')
            scope.setContext('userAction', {
              userId,
              component: 'UserProfile',
              action: 'save',
              timestamp: new Date().toISOString()
            })

            Sentry.captureException(error)
          })

          throw error
        }
      }
    )
  }

  return (
    <div>
      <button onClick={handleSave}>Save Profile</button>
    </div>
  )
}
```

#### API Route Integration

```typescript
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('users-api')

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  // Sentry will automatically capture this log due to pinoIntegration
  logger.info({ requestId, method: 'GET', path: '/api/users' }, 'API request received')

  return Sentry.startSpan(
    {
      op: 'http.server',
      name: 'GET /api/users',
    },
    async (span) => {
      span.setAttribute('requestId', requestId)
      span.setAttribute('method', 'GET')
      span.setAttribute('path', '/api/users')

      try {
        const users = await getUsers()

        span.setAttribute('userCount', users.length)
        logger.info({ requestId, userCount: users.length }, 'Users retrieved successfully')

        return NextResponse.json({ users })
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: 2, message: 'Internal server error' })

        // This error log will be automatically sent to Sentry
        logger.error({ requestId, error }, 'Failed to retrieve users')

        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
      }
    }
  )
}
```

#### Environment Configuration

Ensure your environment variables are properly configured:

```bash
# .env.local
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_AUTH_TOKEN=your_sentry_auth_token_here

# Optional: Control Sentry in different environments
NEXT_PUBLIC_SENTRY_ENVIRONMENT=development
```

#### Performance Monitoring

The Sentry integration includes automatic performance monitoring:

```typescript
// Automatic performance monitoring for database operations
const logger = buildLogger('database-service')

export async function performDatabaseOperation() {
  return Sentry.startSpan(
    {
      op: 'db.query',
      name: 'Complex Database Operation',
    },
    async (span) => {
      const startTime = Date.now()

      try {
        const result = await complexDatabaseQuery()

        const duration = Date.now() - startTime
        span.setAttribute('duration', duration)
        span.setAttribute('recordCount', result.length)

        logger.info(
          {
            operation: 'complexDatabaseQuery',
            duration,
            recordCount: result.length,
          },
          'Database operation completed'
        )

        return result
      } catch (error) {
        span.recordException(error as Error)
        span.setStatus({ code: 2, message: 'Database operation failed' })

        logger.error(
          {
            operation: 'complexDatabaseQuery',
            duration: Date.now() - startTime,
            error,
          },
          'Database operation failed'
        )

        throw error
      }
    }
  )
}
```

#### Best Practices for Sentry Integration

1. **Automatic vs Manual Capture**:

   ```typescript
   // ✅ Let automatic integration handle routine logs
   logger.error({ userId, error }, 'Operation failed')

   // ✅ Use manual capture for critical errors with extra context
   Sentry.withScope((scope) => {
     scope.setTag('critical', 'true')
     scope.setContext('businessContext', { orderId, paymentId })
     Sentry.captureException(error)
   })
   ```

2. **Performance Monitoring**:

   ```typescript
   // ✅ Use spans for important operations
   return Sentry.startSpan({ op: 'business.operation', name: 'ProcessPayment' }, async () => {
     // Your operation here
   })
   ```

3. **Context Management**:

   ```typescript
   // ✅ Set user context for better error tracking
   Sentry.setUser({ id: userId, email: userEmail })

   // ✅ Use tags for filtering in Sentry dashboard
   Sentry.setTag('feature', 'payment-processing')
   ```

4. **Error Boundaries with Sentry**:

   ```typescript
   // src/components/SentryErrorBoundary.tsx
   import * as Sentry from '@sentry/nextjs'

   export class SentryErrorBoundary extends React.Component {
     componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
       Sentry.withScope((scope) => {
         scope.setTag('errorBoundary', true)
         scope.setContext('componentStack', {
           componentStack: errorInfo.componentStack,
         })
         Sentry.captureException(error)
       })
     }
   }
   ```

## Performance Optimization

### 1. Log Level Configuration

```typescript
// Configure appropriate log levels for production
const logger = buildLogger('performance-critical-service')

// Only log important events in production
if (process.env.NODE_ENV === 'production') {
  logger.info({ userId }, 'User action completed')
} else {
  logger.debug({ userId, details: debugInfo }, 'User action completed with details')
}
```

### 2. Conditional Logging

```typescript
// Use conditional logging for expensive operations
const logger = buildLogger('data-processor')

// Note: Pino logger doesn't have isLevelEnabled method
// Use environment checks instead
if (process.env.NODE_ENV === 'development') {
  logger.debug(
    {
      processedData: JSON.stringify(largeDataSet),
    },
    'Data processing completed'
  )
}
```

### 3. Child Logger Reuse

```typescript
// Reuse child loggers to avoid repeated context creation
class UserService {
  private logger = buildLogger('user-service')
  private userLoggers = new Map<string, Logger>()

  private getUserLogger(userId: string): Logger {
    if (!this.userLoggers.has(userId)) {
      this.userLoggers.set(userId, this.logger.child({ userId }))
    }
    return this.userLoggers.get(userId)!
  }

  async updateUser(userId: string, data: UserData) {
    const userLogger = this.getUserLogger(userId)
    userLogger.info({ action: 'update' }, 'Updating user')
    // ... rest of the method
  }
}
```

## Troubleshooting

### Common Issues

1. **Client Component Crashes with Server Logger**

   ```typescript
   // ❌ This will crash in client components
   import { buildLogger } from '@/lib/logger/server'

   // Error: Module not found or undefined
   ```

   **Solution**: Use client logger in client components:

   ```typescript
   // ✅ Correct for client components
   import { buildLogger } from '@/lib/logger/client'
   ```

2. **Runtime Environment Detection Crashes**

   ```typescript
   // ❌ This will crash due to webpack externals
   const logger = typeof window === 'undefined' ? serverLogger : clientLogger
   ```

   **Solution**: Use explicit imports based on component type

3. **TypeScript Errors with Context-First Pattern**

   ```typescript
   // ❌ This will cause TypeScript errors
   logger.info('Message', { context: 'data' })

   // ✅ Use context-first pattern
   logger.info({ context: 'data' }, 'Message')
   ```

4. **No Logs in Production (Client-Side)**
   - This is expected behavior - client logger is no-op in production
   - Use server-side logging for production debugging

5. **Pretty Printing Not Working**

   ```bash
   # Ensure pino-pretty is installed
   pnpm add -D pino-pretty

   # Check development script in package.json
   "dev": "next dev | pino-pretty"
   ```

6. **Log Level Not Working**
   ```typescript
   // Check environment variables
   console.log('LOG_LEVEL:', process.env.LOG_LEVEL)
   console.log('NODE_ENV:', process.env.NODE_ENV)
   ```

### Debug Mode

Enable debug logging in development:

```bash
# Set environment variable
LOG_LEVEL=debug pnpm dev

# Or in .env.local
LOG_LEVEL=debug
```

## Migration Guide

### From Console Logging

```typescript
// Before
console.log('User logged in:', userId)
console.error('Error occurred:', error)

// After
import { buildLogger } from '@/lib/logger/server' // or client

const logger = buildLogger('your-module')
logger.info({ userId }, 'User logged in')
logger.error({ error }, 'Error occurred')
```

### From Other Logging Libraries

```typescript
// Before (Winston, etc.)
logger.info('User action', { userId: '123', action: 'login' })

// After (Pino pattern)
logger.info({ userId: '123', action: 'login' }, 'User action')
```

## Dependencies

- **pino**: ^10.0.0 - Server-side structured logging
- **pino-pretty**: ^13.1.2 - Development log formatting
- **pino-http**: ^11.0.0 - HTTP request logging
- **esbuild-plugin-pino**: ^2.3.3 - Build optimization

## Contributing

When working with the logger system:

1. **Always use context-first pattern**
2. **Include meaningful context in logs**
3. **Use appropriate log levels**
4. **Test both server and client logging**
5. **Update documentation for new patterns**

### Adding New Logger Features

```typescript
// Example: Adding request ID tracking
export const withRequestId = (logger: Logger, requestId: string): Logger => {
  return logger.child({ requestId })
}

// Usage
const requestLogger = withRequestId(logger, generateRequestId())
requestLogger.info({ action: 'process' }, 'Processing request')
```

---

**Last Updated**: December 20, 2025  
**Version**: 1.0.0  
**Dependencies**: pino ^10.0.0, pino-pretty ^13.1.2
