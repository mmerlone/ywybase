# 🏗️ Architecture Guide

## Overview

YwyBase follows a **clean, layered architecture** that prioritizes clarity and maintainability through explicit dependencies and clear separation of concerns.

## 🎯 **Core Principles**

1. **Layered Architecture** - Clear separation between UI, logic, and data
2. **Explicit Dependencies** - No magic, clear client injection
3. **KISS Principle** - Keep It Simple, Stupid
4. **Clear Boundaries** - Server vs client separation

## 🏛️ **Layer Responsibilities**

### **1. Component Layer**

- **UI Rendering** - JSX, styling, user interactions
- **Event Handling** - User actions, form submissions
- **State Consumption** - Consume data from hooks
- **No Business Logic** - Delegate to hooks or actions

```typescript
// Component example - focuses on UI and composition
function UserProfile({ userId }: { userId: string }) {
  const { profile, updateProfile } = useProfile(userId)

  return (
    <Card>
      <ProfileHeader profile={profile} />
      <ProfileForm
        initialData={profile}
        onSubmit={updateProfile}
      />
    </Card>
  )
}
```

### **2. Hook Layer**

- **State Management** - React Query for caching, optimistic updates
- **Business Logic** - Data transformation, validation
- **Service Coordination** - Call multiple actions if needed
- **Error Handling** - Transform errors for UI consumption

```typescript
// Hook example - manages data and state
function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
  })
}
```

### **3. Server Actions Layer**

- **Server-Side Security** - All data operations run on server
- **Direct Database Access** - Server-side Supabase client usage
- **Input Validation** - Zod schemas for type-safe validation
- **Error Handling** - Centralized error handling with proper context
- **Type Safety** - End-to-end type safety from server to client

#### **Server Actions Architecture**

The application uses Next.js Server Actions for secure data operations:

```typescript
// src/lib/actions/profile.ts
export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: ProfileUpdateData): Promise<ProfileResponse<Profile>> => {
    // Validate input
    const validated = profileUpdateSchema.safeParse(updates)
    const validationError = handleServerActionValidation<Profile>(validated, {
      userId,
      operation: 'updateProfile',
    })
    if (validationError) return validationError

    // Server-side database operation
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').update(validated.data).eq('id', userId).select().single()

    if (error) throw error

    return createServerActionSuccess(data, 'Profile updated successfully')
  }
)
```

#### **Hybrid Architecture Benefits**

- **Server Actions** for security, validation, and data operations
- **React Query** for caching, optimistic updates, and client state
- **Best of both worlds**: Security + UX

```typescript
// Hook calls server action but manages client state
const { mutateAsync: updateProfile } = useMutation({
  mutationFn: async (updates: Partial<Profile>) => {
    const result = await updateProfile(userId, updates)
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to update profile')
    }
    return result.data
  },
  // React Query benefits: optimistic updates, caching, error handling
})
```

#### **Server Actions Patterns**

Server actions handle all CRUD operations with consistent patterns:

```typescript
// Authentication actions - src/lib/actions/auth.ts
export const signInWithEmail = withServerActionErrorHandling(
  async (credentials: LoginFormInput): Promise<AuthResponse<{ userId: string }>> => {
    // Validation + server-side auth logic
  }
)

// Profile actions - src/lib/actions/profile.ts
export const getProfile = withServerActionErrorHandling(async (userId: string): Promise<ProfileResponse<Profile>> => {
  // Validation + server-side data fetching
})

// Location actions - src/lib/actions/location.ts
export async function detectCountry(ipAddress?: string): Promise<string | null> {
  // Server-side API calls with caching
}
```

#### **Authentication Patterns**

Authentication is managed via Supabase Auth with server actions for sensitive operations and a client-side helper for UI state:

```typescript
// src/lib/actions/auth/client.ts
export const authService = {
  async getSession(): Promise<Session | null> {
    const supabase = await createClient()
    // ... logic
  },
  // ... other methods
}
```

#### **Server Actions (Primary Pattern)**

**Current Pattern** (Server Actions - actively used):

```typescript
// src/lib/actions/profile.ts
export const getProfile = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile | null>> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()
    // ... error handling
  }
)
```

Server Actions provide the right balance of abstraction and simplicity for this codebase.

## 📊 **Architecture Diagram**

```
┌─────────────────────────────────────────────────────────────┐
│                      Component Layer                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Server     │  │   Client     │  │   Server     │     │
│  │  Component   │  │  Component   │  │   Action     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                  │                  │              │
│         │ Direct Data      │ Custom Hook      │ Direct       │
│         │ Access           │ Usage            │ Data         │
│         │ (via Actions)    │                  │ Access       │
└─────────┼──────────────────┼──────────────────┼──────────────┘
           │                  │                  │
           │                  │                  │
┌──────────┼──────────────────┼──────────────────┼──────────────┐
│          │                  │                  │              │
│          ▼                  ▼                  ▼              │
│    ┌─────────────────────────────────────────────┐           │
│    │            Hook Layer                       │           │
│    │  ┌──────────────────────────────────────┐  │           │
│    │  │  React Query (Caching, State Mgmt)   │  │           │
│    │  │  Business Logic                      │  │           │
│    │  │  Error Transformation                │  │           │
│    │  └──────────────────────────────────────┘  │           │
│    └──────────────────┬─────────────────────────┘           │
│                        │                                       │
│                        │ Action Calls                          │
│                        ▼                                       │
│    ┌─────────────────────────────────────────────┐           │
│    │         Action/Service Layer               │           │
│    │  ┌──────────────────────────────────────┐  │           │
│    │  │  Profile Actions                     │  │           │
│    │  │  Auth Actions                        │  │           │
│    │  │  ... (other modules)                 │  │           │
│    │  └──────────────────────────────────────┘  │           │
│    └──────────────────┬─────────────────────────┘           │
│                        │                                       │
│                        │ Supabase Client                       │
│                        ▼                                       │
│    ┌─────────────────────────────────────────────┐           │
│    │         Database Layer                      │           │
│    │         (Supabase/PostgreSQL)               │           │
│    └─────────────────────────────────────────────┘           │
└───────────────────────────────────────────────────────────────┘

Data Flow:
  Server Component → Action → Database
  Client Component → Hook → Action → Database
  Server Action → Database (via Supabase Client)
```

## 🔄 **Data Flow Patterns**

### **Server Components**

Direct action/service usage for server-side rendering:

```typescript
export default async function ProfileServerComponent({ userId }: { userId: string }) {
  const result = await getProfile(userId)
  const profile = result.success ? result.data : null

  return <div>{profile?.display_name}</div>
}
```

### **Client Components**

Use custom hooks for stateful client components:

```typescript
'use client'
import { useProfile } from '@/hooks/useProfile'

export default function ProfileClientComponent({ userId }: { userId: string }) {
  const { profile, isLoading, error } = useProfile(userId)

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{profile?.display_name ?? 'No profile found'}</div>
}
```

### **Server Actions**

Direct database access for server-side operations:

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'

export const updateProfile = withServerActionErrorHandling(async (userId: string, updates: ProfileUpdateData) => {
  const supabase = await createClient()
  return await supabase.from('profiles').update(updates).eq('id', userId).select().single()
})
```

## 🎯 **Usage Guidelines**

### **When to Use Each Pattern**

| **Scenario**         | **Pattern**    | **Why**                                       |
| -------------------- | -------------- | --------------------------------------------- |
| **Server Component** | Direct Action  | No state, server-side rendering               |
| **Client Component** | Hook           | State management, caching, optimistic updates |
| **Server Action**    | Direct DB/Serv | Server-side operation, no state               |
| **API Route**        | Direct DB/Serv | Server endpoint, no state                     |

## 🔧 **Client Management**

### **Server Client**

```typescript
// src/lib/supabase/server.ts
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()
  return createServerClient<Database>(url, key, { cookies })
}
```

### **Client Client**

```typescript
// src/lib/supabase/client.ts
export function createClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(url, key)
}
```

### **Key Points**

- **Server**: `await createClient()` - async due to cookies
- **Client**: `createClient()` - sync, no cookies needed
- **Explicit**: Always use the appropriate client for the environment
- **No Magic**: No auto-detection or factory patterns

## 📈 **Benefits**

### **Simplicity**

- **Clear File Structure** - logical organization
- **No Hidden Magic** - everything is obvious

### **Performance**

- **React Query Caching** - built-in optimization
- **Server Components** - zero client-side JS

### **Maintainability**

- **Clear Boundaries** - each layer has single responsibility
- **Type Safety** - explicit interfaces
- **Easy Testing** - direct action/hook testing

## 🎉 **Conclusion**

This architecture provides:

- **Clarity** - Easy to understand and debug
- **Performance** - No unnecessary overhead
- **Maintainability** - Clear separation of concerns
- **Scalability** - Works for small and large applications

---

**Last Updated**: March 6, 2026
**Version**: 2.0.0
