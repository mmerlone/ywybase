# Server Actions Reference

This document provides comprehensive reference for all Next.js Server Actions available in the YwyBase application. Server Actions provide secure, server-side data operations with better security and performance compared to traditional API routes.

## Overview

Server Actions in this application:

- **Secure**: Run server-side with proper authentication context
- **Type-Safe**: Full TypeScript integration with Zod validation
- **Error-Handled**: Centralized error handling with structured responses
- **Logged**: Comprehensive audit logging for all operations
- **Rate-Limited**: Built-in protection against abuse

## Response Format

All Server Actions return a standardized `AuthResponse<T>` format:

```typescript
interface AuthResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

## Authentication Server Actions

Located in `/src/lib/actions/auth/server.ts`

### `loginWithEmail(credentials)`

Signs in a user with email and password.

**Parameters:**

```typescript
interface LoginCredentials {
  email: string
  password: string
}
```

**Returns:** `AuthResponse<{ user: User; session: Session }>`

**Example:**

```typescript
import { loginWithEmail } from '@/lib/actions/auth/server'

const result = await loginWithEmail({
  email: 'user@example.com',
  password: 'secure-password',
})

if (result.success) {
  const { user, session } = result.data
  console.log('User logged in:', user.email)
} else {
  console.error('Login failed:', result.error)
}
```

### `signUpWithEmail(credentials)`

Signs up a new user with email and password.

**Parameters:**

```typescript
interface SignUpCredentials {
  email: string
  password: string
  displayName: string
  termsAccepted: boolean
}
```

**Returns:** `AuthResponse<{ user: User; session: Session }>`

**Example:**

```typescript
import { signUpWithEmail } from '@/lib/actions/auth/server'

const result = await signUpWithEmail({
  email: 'user@example.com',
  password: 'secure-password',
  displayName: 'John Doe',
  termsAccepted: true,
})

if (result.success) {
  console.log('User signed up:', result.data.user.email)
} else {
  console.error('Sign up failed:', result.error)
}
```

### `signOut()`

Terminates the current user session.

**Parameters:** None

**Returns:** `AuthResponse<null>`

**Example:**

```typescript
import { signOut } from '@/lib/actions/auth/server'

const result = await signOut()
if (result.success) {
  console.log('User signed out successfully')
}
```

### `forgotPassword(data)`

Initiates password reset flow by sending reset email.

**Parameters:**

```typescript
interface ForgotPasswordData {
  email: string
}
```

**Returns:** `AuthResponse<null>`

**Example:**

```typescript
import { forgotPassword } from '@/lib/actions/auth/server'

const result = await forgotPassword({
  email: 'user@example.com',
})

if (result.success) {
  console.log('Password reset email sent')
}
```

### `completePasswordReset(data)`

Completes password reset by setting new password.

**Parameters:**

```typescript
interface CompletePasswordResetData {
  password: string
  confirmPassword: string
}
```

**Returns:** `AuthResponse<User>`

**Example:**

```typescript
import { completePasswordReset } from '@/lib/actions/auth/server'

const result = await completePasswordReset({
  password: 'new-secure-password',
  confirmPassword: 'new-secure-password',
})

if (result.success) {
  console.log('Password reset completed')
}
```

### `updatePassword(data)`

Updates user password (for logged-in users).

**Parameters:**

```typescript
interface UpdatePasswordData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}
```

**Returns:** `AuthResponse<User>`

**Example:**

```typescript
import { updatePassword } from '@/lib/actions/auth/server'

const result = await updatePassword({
  currentPassword: 'old-password',
  newPassword: 'new-password',
  confirmPassword: 'new-password',
})

if (result.success) {
  console.log('Password updated successfully')
}
```

### `resendVerification()`

Resends verification email for current logged-in user.

**Parameters:** None

**Returns:** `AuthResponse<null>`

**Example:**

```typescript
import { resendVerification } from '@/lib/actions/auth/server'

const result = await resendVerification()
if (result.success) {
  console.log('Verification email resent')
}
```

### `checkVerificationStatus(userId)`

Checks email verification status for a user.

**Parameters:**

- `userId` (string): User ID to check

**Returns:** `AuthResponse<{ verified: boolean; email: string }>`

**Example:**

```typescript
import { checkVerificationStatus } from '@/lib/actions/auth/server'

const result = await checkVerificationStatus('user-uuid')
if (result.success) {
  console.log('Verification status:', result.data.verified)
}
```

## Profile Server Actions

Located in `/src/lib/actions/profile.ts`

### `getProfile(userId)`

Retrieves user profile by ID.

**Parameters:**

- `userId` (string): User ID to fetch profile for

**Returns:** `AuthResponse<Profile>`

**Example:**

```typescript
import { getProfile } from '@/lib/actions/profile'

const result = await getProfile('user-uuid')
if (result.success) {
  console.log('Profile:', result.data.display_name)
}
```

### `createProfile(userId, profileData)`

Creates a new profile for a user.

**Parameters:**

```typescript
interface CreateProfileData {
  display_name: string
  avatar_url?: string
  bio?: string
}
```

**Returns:** `AuthResponse<Profile>`

**Example:**

```typescript
import { createProfile } from '@/lib/actions/profile'

const result = await createProfile('user-uuid', {
  display_name: 'John Doe',
  bio: 'Software Developer',
})

if (result.success) {
  console.log('Profile created:', result.data.id)
}
```

### `updateProfile(userId, updates)`

Updates existing user profile.

**Parameters:**

```typescript
interface ProfileUpdates {
  display_name?: string
  avatar_url?: string
  bio?: string
  phone?: string
}
```

**Returns:** `AuthResponse<Profile>`

**Example:**

```typescript
import { updateProfile } from '@/lib/actions/profile'

const result = await updateProfile('user-uuid', {
  display_name: 'John Smith',
  bio: 'Senior Developer',
})

if (result.success) {
  console.log('Profile updated:', result.data.display_name)
}
```

### `uploadAvatar(userId, file)`

Uploads profile avatar image.

**Parameters:**

- `userId` (string): User ID to upload avatar for
- `file` (File): Image file to upload

**Returns:** `AuthResponse<{ avatar_url: string }>`

**Example:**

```typescript
import { uploadAvatar } from '@/lib/actions/profile'

const file = new File(['image-data'], 'avatar.jpg', { type: 'image/jpeg' })
const result = await uploadAvatar('user-uuid', file)

if (result.success) {
  console.log('Avatar uploaded:', result.data.avatar_url)
}
```

### `getOptimizedAvatarUrls(avatarUrl)`

Gets optimized avatar URLs for different sizes.

**Parameters:**

- `avatarUrl` (string): Original avatar URL

**Returns:** `AuthResponse<{ small: string; medium: string; large: string }>`

**Example:**

```typescript
import { getOptimizedAvatarUrls } from '@/lib/actions/profile'

const result = await getOptimizedAvatarUrls('https://example.com/avatar.jpg')
if (result.success) {
  console.log('Optimized URLs:', result.data)
}
```

## Location Server Actions

Located in `/src/lib/actions/location.ts`

### `detectCountry(ipAddress?)`

Detects user country from IP address with caching.

**Parameters:**

- `ipAddress` (string, optional): IP address to detect country for. If not provided, uses request IP.

**Returns:** `AuthResponse<{ country: string; code: string; flag: string }>`

**Example:**

```typescript
import { detectCountry } from '@/lib/actions/location'

// Auto-detect from request
const result = await detectCountry()
if (result.success) {
  console.log('Country detected:', result.data.country)
}

// Specific IP address
const result2 = await detectCountry('8.8.8.8')
if (result2.success) {
  console.log('Country for 8.8.8.8:', result2.data.country)
}
```

**Features:**

- Automatic IP detection when no address provided
- External API integration with ipgeolocation.io
- Graceful error handling and timeouts
- Response caching for performance

## Error Handling

All Server Actions use centralized error handling:

```typescript
// Success response
{
  success: true,
  data: { /* actual data */ },
  message: 'Operation completed successfully'
}

// Error response
{
  success: false,
  error: 'Error description',
  message: 'Operation failed'
}
```

## Security Features

- **Authentication Context**: Actions run with proper user authentication
- **Input Validation**: All inputs validated with Zod schemas
- **Rate Limiting**: Built-in protection against abuse
- **Audit Logging**: All operations logged with context
- **Error Sanitization**: Sensitive information never leaked in errors

## Usage Patterns

### In Server Components

```typescript
import { getProfile } from '@/lib/actions/profile'

export default async function ProfilePage({ userId }: { userId: string }) {
  const result = await getProfile(userId)

  if (!result.success) {
    return <div>Error loading profile</div>
  }

  return <div>Hello, {result.data.display_name}</div>
}
```

### In Client Components

```typescript
'use client'
import { updateProfile } from '@/lib/actions/profile'
import { useState } from 'react'

export function ProfileEditor({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)

  const handleUpdate = async (data: ProfileUpdates) => {
    setLoading(true)
    const result = await updateProfile(userId, data)
    setLoading(false)

    if (result.success) {
      console.log('Profile updated!')
    } else {
      console.error('Update failed:', result.error)
    }
  }

  // Component JSX...
}
```

## Related Documentation

- [API Endpoints Reference](./api-reference.md) - HTTP API endpoints
- [Authentication Flows](../authentication-flows.md) - Complete auth flow documentation
- [Error Handling](../src/lib/error/README.md) - Centralized error handling system
- [Supabase Integration](../src/lib/supabase/README.md) - Database and auth integration

---

**Last Updated**: 2025-02-27  
**Version**: 1.0.0
