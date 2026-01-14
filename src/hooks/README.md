# Hooks Library

This directory contains custom React hooks that provide reusable stateful logic for components. Each hook is designed to be composable and follows React best practices.

## 🏗️ **Available Hooks**

### Authentication Hooks

- `useAuth` - Authentication state and methods (Compatibility layer)
- `useAuthForm` - Form handling for auth flows with React Hook Form and Zod

### UI/UX Hooks

- `useCookieConsent` - GDPR cookie management and preferences
- `useIsMobile` - Viewport detection for responsive design
- `useProfile` - User profile data fetching and updates (via React Query)
- `useOptimizedAvatar` - Helper for generating optimized Supabase image URLs

## 🚀 **Basic Usage**

```typescript
import { useAuth } from '@/hooks/useAuth'
import { useProfile } from '@/hooks/useProfile'

function UserProfile({ userId }: { userId: string }) {
  const { authUser } = useAuth()
  const { profile, isLoading } = useProfile(userId)

  if (isLoading) return <div>Loading...</div>
  // ...
}
```

## 🛠️ **Creating Hooks**

1. **Basic Hook Structure**:

```typescript
// src/hooks/useFeature.ts
import { useState, useCallback } from 'react'

export function useFeature(initialValue = '') {
  const [state, setState] = useState(initialValue)
  const update = useCallback((value: string) => setState(value), [])
  return { state, update }
}
```

2. **With Logging**:

```typescript
// Example: import client-side logger
import { logger } from '@/lib/logger/client'

export function useFeature(initialValue = '') {
  const [state, setState] = useState(initialValue)
  const update = useCallback((value: string) => {
    logger.debug({ value }, 'Feature updated')
    setState(value)
  }, [])
  return { state, update }
}
```

## 📚 **Hook Guides**

### **useAuth** (`useAuth.ts`)

Manages authentication state and provides auth operations via the client-side `authService`.

**What it does**: Handles user sessions, login/logout, and auth state changes.

**How to use**:

```typescript
const { authUser, signIn, signOut, isLoading, error } = useAuth()

// Login user
await signIn('user@example.com', 'password')

// Check authentication status
if (authUser) {
  // User is authenticated
}
```

### **useAuthForm** (`useAuthForm.ts`)

Form validation for authentication operations using React Hook Form and centralized Zod schemas.

**What it does**: Provides type-safe form handling for Login, Sign Up, and Password Reset.

**How to use**:

```typescript
import { AuthOperationsEnum } from '@/types/enums'

function LoginForm() {
  const { form, onSubmit, isLoading } = useAuthForm(AuthOperationsEnum.LOGIN)

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      <input {...form.register('email')} />
      {form.formState.errors.email && (
        <span>{form.formState.errors.email.message}</span>
      )}
      <button type="submit" disabled={isLoading}>Login</button>
    </form>
  )
}
```

### **useProfile** (`useProfile.ts`)

Manages user profile data using TanStack Query for caching and synchronization.

**What it does**: Fetches profile data, handles updates, and manages avatar uploads.

**How to use**:

```typescript
const { profile, isLoading, updateProfile, uploadAvatar } = useProfile(userId)

// Update profile
await updateProfile({ display_name: 'New Name' })

// Upload avatar
await uploadAvatar(file)
```

### **useCookieConsent** (`useCookieConsent.ts`)

Manages GDPR cookie consent state and user preferences across the application.

**What it does**: Tracks user consent status (accept/decline/not decided) and detailed category preferences (necessary, functional, analytics, marketing). It handles persistence in localStorage and provides methods to manage the consent banner.

**How to use**:

```typescript
const { preferences, hasConsent, isBannerOpen, acceptAll, acceptSelected, decline, showBanner } = useCookieConsent()

// Accept all cookie categories
await acceptAll()

// Decline all non-essential cookies
await decline()

// Accept only specific categories (necessary is always forced to true)
await acceptSelected({ analytics: true, functional: false })

// User preferences object structure:
// { necessary: boolean, functional: boolean, analytics: boolean, marketing: boolean }
console.log(preferences.analytics)
```

### **useOptimizedAvatar** (`useOptimizedAvatar.ts`)

Provides optimized avatar URLs using Supabase's image transformation API.

**What it does**: Generates URLs for different avatar sizes (small, medium, large) with automatic optimization.

**How to use**:

```typescript
import { AVATAR_SIZES } from '@/lib/utils/image-utils'

const { getUrl } = useOptimizedAvatar(profile.avatar_url)

// Get a medium sized optimized URL (default)
const avatarUrl = getUrl(AVATAR_SIZES.medium)
```

### **useIsMobile** (`useIsMobile.ts`)

Viewport detection hook to determine if the user is on a mobile device.

**What it does**: Tracks window width and returns `true` if it's below the mobile breakpoint (768px). It is safe for SSR and handles hydration.

**How to use**:

```tsx
const isMobile = useIsMobile()

return <div>{isMobile ? <MobileView /> : <DesktopView />}</div>
```

## 🛠️ **Best Practices**

1. **Follow Hook Rules** - Never call hooks conditionally.
2. **Use Callbacks** - Wrap functions in `useCallback` for stable references.
3. **Handle Loading/Error States** - Always expose loading and error states from data hooks.
4. **Type Everything** - Use TypeScript for hook parameters and return values.

---

**Last Updated**: 2025-12-28  
**Version**: 2.0.0
