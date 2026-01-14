# Supabase Integration

A production-ready Supabase integration with explicit client injection and clean service architecture.

## Overview

This Supabase integration provides:

- **Client/Server Separation** - Proper environment-specific client creation
- **Explicit Client Injection** - No magic, clear dependencies
- **Simplified Service Layer** - Direct service instantiation
- **Optional Hooks** - Custom hooks for client state management when needed
- **Type Safety** - Full TypeScript integration with database types

## Architecture

```
src/lib/supabase/
├── client.ts              # Browser-side Supabase client
├── server.ts              # Server-side Supabase client
├── middleware.ts          # Session management middleware
├── index.ts               # Main exports and types
└── services/              # Service layer architecture
    ├── base.service.ts           # Abstract base service with shared logic
    ├── base.client.service.ts    # Client-side service base
    ├── base.server.service.ts    # Server-side service base
    ├── base.interface.ts         # Service interface definitions
    └── database/
        └── profiles/
            └── profile.service.ts           # Abstract base profile service
```

## Service Layer Architecture

The service layer features a **unified base service** with complete dependency injection and zero code duplication:

### Key Features

- **🔄 Zero Code Duplication**: Single universal implementation with thin environment wrappers
- **💉 Complete Dependency Injection**: Client, logger, and error handler all injected
- **🎯 Consistent Naming**: Clear `*.client.service.ts` and `*.server.service.ts` pattern
- **🧪 Maximum Testability**: All dependencies can be mocked independently
- **🔒 Type Safety**: Full TypeScript support with proper interfaces

### Architecture Overview

```typescript
// Abstract base ProfileService with shared business logic
abstract class ProfileService extends BaseService {
  // All profile operations implemented once
  async getProfile(userId: string): Promise<Profile | null> {
    /* ... */
  }
}

// In Next.js 15, we typically use Server Actions for data operations
// that interact with this service layer or the database directly.
```

### Service Naming Convention

```
src/lib/supabase/services/database/[domain]/
├── [domain].service.ts           # Abstract base service with shared business logic
├── [domain].client.service.ts    # Client-side service (browser environment)
└── [domain].server.service.ts    # Server-side service (Node.js environment)
```

**Examples:**

- `profile.service.ts` - Abstract base with all profile operations
- `profile.client.service.ts` - Client-side profile service
- `profile.server.service.ts` - Server-side profile service
- `user.service.ts` - Abstract base with all user operations
- `user.client.service.ts` - Client-side user service
- `user.server.service.ts` - Server-side user service

### Server Actions Usage

```typescript
// Server actions are the primary interface for database operations
import { getProfile } from '@/lib/actions/profile'
const result = await getProfile(userId)
if (result.success) {
  const profile = result.data
}
```

## Quick Start

### Client-Side Usage

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'

export function UserProfile() {
  const supabase = createClient()
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        return
      }

      setProfile(data)
    }

    fetchProfile()
  }, [])

  return <div>{profile?.display_name}</div>
}
```

### Server-Side Usage

```typescript
import { createClient } from '@/lib/supabase/server'

export default async function ServerProfile({ userId }: { userId: string }) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return <div>{profile?.display_name}</div>
}
```

### Server Action Usage

```typescript
import { getProfile } from '@/lib/actions/profile'

export async function useProfileData(userId: string) {
  const result = await getProfile(userId)

  if (!result.success) {
    console.error('Failed to get user profile:', result.error)
    return null
  }

  return result.data
}
```

## Core Concepts

### 1. Client/Server Separation

The system provides separate client creation methods for different environments:

**Client Components** (`'use client'`):

```typescript
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

**Server Components/Actions**:

```typescript
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()
```

### 2. Standardized Error Handling

All database operations should use the centralized error handling system:

```typescript
// Consistent error handling across actions and services
try {
  const { data, error } = await supabase.from('profiles').select().single()
  if (error) throw error
} catch (error) {
  return this.handleError(error, 'operation', { context })
}
```

### Service Architecture

Base service class with explicit dependency injection:

```typescript
export abstract class MyService extends BaseService {
  // Abstract services contain shared business logic
  // Concrete implementations handle environment-specific setup

  async getData(id: string) {
    try {
      const { data, error } = await this.client.from('table').select('*').eq('id', id).single()
      if (error) throw error
      return data
    } catch (error) {
      return this.handleError(error, 'fetch data', { id })
    }
  }
}

// Client implementation
export class MyClientService extends MyService {
  constructor() {
    const client = createClient()
    const logger = buildLogger('MyClientService')
    super(client, logger, handleClientError)
  }
}

// Server implementation
export class MyServerService extends MyService {
  private constructor(client: SupabaseClient<Database>, logger: Logger) {
    super(client, logger, handleServerError)
  }

  static async create(): Promise<MyServerService> {
    const client = await createClient()
    const logger = buildLogger('MyServerService')
    return new MyServerService(client, logger)
  }
}
```

## API Reference

### Client Creation

#### createClient() (Client-side)

Creates a Supabase client for browser usage.

```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
```

**Usage**: Client components, browser-side code only
**Returns**: `SupabaseClient<Database>`

#### createClient() (Server-side)

Creates a Supabase client for server usage.

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
```

**Usage**: Server components, route handlers, server actions
**Returns**: `Promise<SupabaseClient<Database>>`

### Session Management

#### updateSession(request)

Middleware function for session management and token rotation.

```typescript
import { updateSession } from '@/lib/supabase/middleware'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}
```

**Features**:

- Automatic token refresh
- Secure cookie management
- Session rotation
- Error handling

### Service Layer

#### BaseService

Abstract base class for all Supabase services.

```typescript
export class MyService extends BaseService {
  // Inherits:
  // - this.client: SupabaseClient instance
  // - this.logger: Logger instance
  // - this.handleError(): Error handling method
}
```

**Methods**:

- `handleError(error, operation, context)` - Centralized error handling
- `client` - Supabase client instance
- `logger` - Logger instance

#### Server Actions

Primary interface for all database operations:

- **Profile Actions** (`@/lib/actions/profile.ts`)
  - `getProfile(userId)` - Fetch user profile
  - `createProfile(userId, data)` - Create new profile
  - `updateProfile(userId, data)` - Update profile
  - `uploadAvatar(userId, file)` - Upload avatar image

- **Auth Actions** (`@/lib/actions/auth/server.ts`)
  - `loginWithEmail(credentials)` - User authentication
  - `signUpWithEmail(credentials)` - User registration
  - `signOut()` - User logout
  - `forgotPassword(email)` - Password reset request
  - `resendVerification(formData)` - Resend verification email

## Configuration

### Environment Variables

```bash
# Required
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Optional
LOG_LEVEL=info
NODE_ENV=production
```

### Session Configuration

Session management is configured in `middleware.ts`:

```typescript
const defaultConfig = {
  sessionLifetime: 60 * 60 * 24, // 24 hours
  rotationInterval: 60 * 60, // 1 hour
  enforceSingleSession: true,
  cookie: {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}
```

## Database Types

The system uses TypeScript types generated from your Supabase schema:

```typescript
import type { Database } from '@/types/supabase'

// Tables are strongly typed
const { data } = await supabase
  .from('profiles') // Table name is validated
  .select('*')
```

### Type Generation

Generate types from your Supabase schema:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID --schema public > types/supabase.ts
```

## Best Practices

### 1. Proper Client Usage

Use the correct client for your environment:

```typescript
// Correct - Client component
'use client'
import { createClient } from '@/lib/supabase/client'

// Correct - Server component
import { createClient } from '@/lib/supabase/server'

// Incorrect - Using server client in client component
;('use client')
import { createClient } from '@/lib/supabase/server' // Will cause errors
```

### 2. Service Instantiation

Use the recommended patterns for this project:

```typescript
// Recommended - Server actions for server components
import { getProfile } from '@/lib/actions/profile'

export default async function ProfileServerComponent({ userId }: { userId: string }) {
  const result = await getProfile(userId)
  const profile = result.success ? result.data : null
  return <div>{profile?.display_name ?? 'No profile found'}</div>
}

// Recommended - Direct Supabase client for complex queries
import { createClient } from '@/lib/supabase/server'

export default async function ComplexServerComponent() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('*, posts(*)') // Join query
    .eq('active', true)

  if (error) throw error
  return <div>{/* render data */}</div>
}
```

> **Architecture Note**: While service classes exist in this codebase, **server actions are the primary pattern** for server-side operations. Services are kept for reference but not actively used.

### 3. Using Custom Hooks (Optional)

Use custom hooks for client components when you need state management:

```typescript
// Good - Use hook for client components
import { useProfile } from '@/hooks/useProfile'

export function ProfileComponent({ userId }: { userId: string }) {
  const { profile, isLoading, error, updateProfile } = useProfile(userId)
  // Hook handles React Query, caching, optimistic updates
}
```

### 4. Type Safety

Leverage TypeScript for database operations:

```typescript
// Good - Strongly typed
interface Profile {
  id: string
  display_name: string
  avatar_url: string | null
}

const { data: profile }: { data: Profile | null } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// Avoid - Untyped operations
const { data } = await supabase.from('profiles').select('*')
```

## Integration Examples

### Next.js App Router (Server Component)

```typescript
// app/dashboard/page.tsx
import { getProfile } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const result = await getProfile(user?.id || '')
  const profile = result.data

  return <div>Welcome, {profile?.display_name}</div>
}
```

### API Routes

```typescript
// app/api/profile/route.ts
import { getProfile } from '@/lib/actions/profile'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const result = await getProfile(user.id)
  return Response.json({ profile: result.data })
}
```

### Server Actions

```typescript
// app/actions.ts
'use server'

import { updateProfile as updateProfileAction } from '@/lib/actions/profile'

export async function handleUpdateProfile(formData: FormData) {
  const updates = {
    display_name: formData.get('displayName') as string,
  }

  const result = await updateProfileAction(updates)
  return result
}
```

### Client Components with Real-time

```typescript
'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function RealtimeProfile({ userId }: { userId: string }) {
  const [profile, setProfile] = useState(null)
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    const fetchProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      setProfile(data)
    }

    fetchProfile()

    // Real-time subscription
    const subscription = supabase
      .channel(`profile:${userId}`)
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`
        },
        (payload) => {
          setProfile(payload.new)
        }
      )
      .subscribe()

    return () => subscription.unsubscribe()
  }, [userId, supabase])

  return <div>{profile?.display_name}</div>
}
```

## Security Considerations

### 1. Row Level Security (RLS)

Enable RLS on all tables and create proper policies:

```sql
-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 2. API Key Security

- Never expose service role keys in client code
- Use environment variables for all credentials
- Implement proper CORS settings in Supabase

### 3. Session Security

- Configure proper cookie settings
- Use HTTPS in production
- Implement session timeout policies
- Monitor for suspicious activity

## Testing

The unified service architecture makes testing straightforward with complete dependency injection:

```typescript
describe('ProfileService', () => {
  it('should fetch profile with mocked dependencies', async () => {
    const mockClient = createMockSupabaseClient()
    const mockLogger = createMockLogger()
    const mockErrorHandler = jest.fn()

    // Full control over all dependencies
    const service = new BaseService(mockClient, mockLogger, mockErrorHandler)

    // Test with complete isolation
    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
        }),
      }),
    })

    const result = await service.getProfile('user-123')

    expect(result).toEqual(mockProfile)
    expect(mockLogger.debug).toHaveBeenCalledWith({ userId: 'user-123' }, 'Fetching user profile')
  })

  it('should handle errors properly', async () => {
    const mockClient = createMockSupabaseClient()
    const mockLogger = createMockLogger()
    const mockErrorHandler = jest.fn().mockImplementation(() => {
      throw new AppError('Database error')
    })

    const service = new BaseService(mockClient, mockLogger, mockErrorHandler)

    mockClient.from.mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: new Error('DB Error') }),
        }),
      }),
    })

    await expect(service.getProfile('user-123')).rejects.toThrow('Database error')
    expect(mockErrorHandler).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        operation: 'fetch profile',
        userId: 'user-123',
        service: 'BaseService',
      })
    )
  })
})
```

## Performance Optimization

### 1. Connection Pooling

The server client uses connection pooling automatically:

```typescript
// Server-side - connections are pooled
const supabase = await createClient()

// Client-side - single instance per component
const supabase = createClient()
```

### 2. Query Optimization

Use efficient queries and indexes:

```typescript
// ✅ Good - Select specific columns
const { data } = await supabase.from('profiles').select('id, display_name, avatar_url').eq('id', userId)

// ✅ Good - Use indexes
const { data } = await supabase.from('profiles').select('*').eq('email', email) // Ensure email is indexed
```

### 3. Caching Strategy

Implement caching for frequently accessed data:

```typescript
// Service layer with caching
export class ProfileService extends BaseService {
  private cache = new Map<string, { data: Profile; timestamp: number }>()
  private CACHE_TTL = 5 * 60 * 1000 // 5 minutes

  async getProfile(userId: string): Promise<Profile | null> {
    const cached = this.cache.get(userId)
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data
    }

    const profile = await this.fetchProfile(userId)
    if (profile) {
      this.cache.set(userId, { data: profile, timestamp: Date.now() })
    }
    return profile
  }
}
```

## Troubleshooting

### Common Issues

1. **"Client is not a constructor" error**
   - Ensure you're using the correct import path
   - Client components: `@/lib/supabase/client`
   - Server components: `@/lib/supabase/server`

2. **"Cookies are not allowed" error**
   - Check middleware configuration
   - Ensure proper cookie settings in production

3. **Type errors with database operations**
   - Generate updated types: `npx supabase gen types...`
   - Check that your schema matches the types

4. **Performance issues**
   - Use service layer for connection management
   - Implement proper indexing in database
   - Use query optimization

### Debug Mode

Enable debug logging for troubleshooting:

```typescript
// In development
import { buildLogger } from '@/lib/logger/server'
const logger = buildLogger('debug')
```

## Migration Guide

### From Direct Supabase Usage

```typescript
// Before
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
const supabase = createClientComponentClient()

// After
import { createClient } from '@/lib/supabase/client'
const supabase = createClient()
```

### From Custom Service Classes

```typescript
// Before: Manual dependency management
class ProfileService {
  private supabase: SupabaseClient

  constructor() {
    this.supabase = createClient()
  }

  async getProfile(id: string) {
    const { data, error } = await this.supabase.from('profiles').select('*')
    if (error) throw error
    return data
  }
}

// After: Clean architecture with dependency injection
export abstract class ProfileService extends BaseService {
  // Shared business logic implemented once
  async getProfile(userId: string) {
    try {
      const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).single()
      if (error) throw error
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'fetch profile', { userId })
    }
  }
}

// Client implementation
export class ProfileClientService extends ProfileService {
  constructor() {
    const client = createClient()
    const logger = buildLogger('ProfileClientService')
    super(client, logger, handleClientError)
  }
}

// Server implementation with server actions (recommended pattern)
export const getProfile = withServerActionErrorHandling(async (userId: string): Promise<AuthResponse<Profile>> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

  if (error) throw error
  return createServerActionSuccess(data)
})

// Usage - Client components
const profileService = new ProfileClientService()

// Usage - Server components (recommended)
const result = await getProfile(userId)
const profile = result.success ? result.data : null
```

> **Note**: This project primarily uses server actions for server-side operations. Service classes exist but are not the primary pattern.

## Contributing

When adding new services or features:

1. **Extend BaseService** for new service classes
2. **Use proper client separation** (client vs server)
3. **Include comprehensive error handling**
4. **Add TypeScript types** for all operations
5. **Write tests** for service methods
6. **Update documentation** with examples

### Adding a New Data Domain

1.  **Create Validator**: Define the schema in `src/lib/validators/[domain].ts`.
2.  **Create Abstract Service** (Optional): If you have shared business logic, extend `BaseService` in `src/lib/supabase/services/database/`.
3.  **Create Server Actions**: Implement CRUD operations in `src/lib/actions/[domain].ts` using `withServerActionErrorHandling`.
4.  **Create Hooks**: If needed for client-side state, create a hook in `src/hooks/use[Domain].ts`.

---

**Last Updated**: 2025-11-30  
**Version**: 1.0.0  
**Dependencies**: @supabase/supabase-js, @supabase/ssr
