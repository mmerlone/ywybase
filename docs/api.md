# API Documentation

This document provides comprehensive documentation for all API endpoints and Server Actions in the YwyBase application.

## Base URL

```
https://your-domain.com/api
```

## Authentication

Most API endpoints require authentication via Supabase Auth. Authentication is handled through:

- **Session Cookies**: Automatically managed by Supabase Auth
- **JWT Tokens**: Included in Authorization header when needed

## Error Handling

All API endpoints use centralized error handling with consistent response formats:

```typescript
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400,
    "context": {
      "operation": "operation-name",
      "additional": "context"
    }
  }
}
```

## Security Headers

All API responses include comprehensive security headers:

- `Content-Security-Policy`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`

## Server Actions

This application uses Next.js Server Actions for secure, server-side data operations. Server Actions provide better security and performance compared to traditional API routes.

### Authentication Server Actions

Located in `/src/lib/actions/auth/server.ts`

#### `loginWithEmail(credentials)`

Signs in a user with email and password.

```typescript
import { loginWithEmail } from '@/lib/actions/auth/server'

const result = await loginWithEmail({
  email: 'user@example.com',
  password: 'securePassword123',
})

if (result.success) {
  const userId = result.data.userId
  // Handle successful login
}
```

#### `signUpWithEmail(credentials)`

Signs up a new user with email and password.

```typescript
import { signUpWithEmail } from '@/lib/actions/auth/server'

const result = await signUpWithEmail({
  email: 'new@example.com',
  password: 'securePassword123',
  name: 'John Doe',
  confirmPassword: 'securePassword123',
  acceptTerms: true,
})
```

#### `signOut()`

Terminates the current user session.

```typescript
import { signOut } from '@/lib/actions/auth/server'

const result = await signOut()
if (result.success) {
  // Redirect to login page
}
```

#### `forgotPassword(data)`

Initiates password reset flow by sending reset email.

```typescript
import { forgotPassword } from '@/lib/actions/auth/server'

const result = await forgotPassword({
  email: 'user@example.com',
})
```

#### `completePasswordReset(data)`

Completes password reset by setting new password.

```typescript
import { setPassword } from '@/lib/actions/auth/server'

const result = await setPassword({
  password: 'newSecurePassword123!',
  confirmPassword: 'newSecurePassword123!',
})
```

#### `updatePassword(data)`

Updates user password (for logged-in users).

```typescript
import { updatePassword } from '@/lib/actions/auth/server'

const result = await updatePassword({
  currentPassword: 'oldPassword123',
  newPassword: 'newSecurePassword123!',
  confirmPassword: 'newSecurePassword123!',
})
```

#### `resendVerification()`

Resends verification email for current logged-in user.

```typescript
import { resendVerification } from '@/lib/actions/auth/server'

const result = await resendVerification()
```

#### `checkVerificationStatus(userId)`

Checks email verification status for a user.

```typescript
import { checkVerificationStatus } from '@/lib/actions/auth/server'

const formData = new FormData()
formData.append('userId', 'user-123')

const result = await checkVerificationStatus(formData)
```

### Profile Server Actions

Located in `/src/lib/actions/profile.ts`

#### `getProfile(userId)`

Retrieves user profile by ID.

```typescript
import { getProfile } from '@/lib/actions/profile'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('profile-handler')

const result = await getProfile('user-123')
if (result.success && result.data) {
  logger.info({ displayName: result.data.display_name }, 'Profile retrieved')
}
```

#### `createProfile(userId, profileData)`

Creates a new profile for a user.

```typescript
import { createProfile } from '@/lib/actions/profile'

const result = await createProfile('user-123', {
  display_name: 'John Doe',
  email: 'john@example.com',
})
```

#### `updateProfile(userId, updates)`

Updates existing user profile.

```typescript
import { updateProfile } from '@/lib/actions/profile'

const result = await updateProfile('user-123', {
  display_name: 'John Smith',
  bio: 'Updated bio',
})
```

#### `uploadAvatar(userId, file)`

Uploads profile avatar image.

```typescript
import { uploadAvatar } from '@/lib/actions/profile'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('avatar-handler')

const result = await uploadAvatar('user-123', file)
if (result.success) {
  logger.info({ avatarUrl: result.data }, 'Avatar uploaded successfully')
}
```

#### `getOptimizedAvatarUrls(avatarUrl)`

Gets optimized avatar URLs for different sizes.

```typescript
import { getOptimizedAvatarUrls } from '@/lib/actions/profile'
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('avatar-urls')

const urls = await getOptimizedAvatarUrls(profile.avatar_url)
if (urls?.data) {
  logger.debug(
    {
      thumbnail: urls.data.thumbnail,
      medium: urls.data.medium,
      large: urls.data.large,
    },
    'Optimized avatar URLs generated'
  )
}
```

### Location Server Actions

Located in `/src/lib/actions/location.ts`

#### `detectCountry(ipAddress?)`

Detects user country from IP address with caching.

```typescript
import { detectCountry } from '@/lib/actions/location'

const country = await detectCountry() // Auto-detect
// or
const country = await detectCountry('192.168.1.1')
```

**Features:**

- 24-hour in-memory cache with LRU eviction
- Automatic IP detection when no address provided
- External API integration with ipgeolocation.io
- Graceful error handling and timeouts

## Endpoints

### Authentication

The application uses Supabase Auth with PKCE (Proof Key for Code Exchange) for secure email-based authentication flows. All email verification and password reset operations use the shared `handleEmailAuthCode` utility located in `/src/lib/utils/email-auth-handler.ts`.

#### Authentication Flows

For complete authentication flow diagrams and detailed implementation, see **[Authentication Flows Documentation](./authentication-flows.md)**.

The authentication system supports:

- **Email Verification Flow** - Sign-up with email verification
- **Password Reset Flow** - Forgot password with secure reset
- **PKCE Security** - Proof Key for Code Exchange for enhanced security
- **Rate Limiting** - Protection against brute force attacks
- **Audit Logging** - Complete security event tracking

#### Shared Email Authentication Utility

Both flows use the reusable `handleEmailAuthCode()` utility:

**Location:** `/src/lib/utils/email-auth-handler.ts`

**Features:**

- Supports both `'signup'` and `'recovery'` auth types
- PKCE code validation and exchange
- Automatic session creation via `exchangeCodeForSession()`
- Security event logging
- Flash message integration
- Centralized error handling
- Configurable success messages and redirects

**Usage:**

```typescript
import { handleEmailAuthCode } from '@/lib/utils/email-auth-handler'

const result = await handleEmailAuthCode(request, supabase, {
  type: 'signup', // or 'recovery'
  successMessage: 'Email verified successfully!',
  logContext: {
    flow: 'email-verification',
  },
})

return result.response // NextResponse with redirect
```

#### Email Verification Endpoint

Handles email verification links from sign-up flow.

**Endpoint:** `GET /api/auth/confirm`

**Parameters:**

- `code` (string, required): The PKCE verification code from the email link

**Response:**

- **Success**: Auto-logs in user, redirects to `/profile` with success flash message
- **Error**: Redirects to `/error` with error code

**Example Request:**

```
GET /api/auth/confirm?code=pkce-verification-code-here
```

**Security Features:**

- Modern PKCE flow (Proof Key for Code Exchange)
- Rate limiting (emailVerification)
- Security audit logging
- Flash messages via secure cookies
- Automatic session creation

**Error Codes:**

- `verification_failed`: Invalid or expired code
- `invalid_verification_link`: Missing code parameter

#### Password Reset Endpoint

Handles password reset links from forgot password flow.

**Endpoint:** `GET /api/auth/reset-password`

**Parameters:**

- `code` (string, required): The PKCE recovery code from the email link

**Response:**

- **Success**: Auto-logs in user, redirects to `/auth?op=set-password` to enter new password
- **Error**: Redirects to `/error` with error code

**Example Request:**

```
GET /api/auth/reset-password?code=pkce-recovery-code-here
```

**Security Features:**

- Modern PKCE flow (Proof Key for Code Exchange)
- Rate limiting (emailVerification)
- Security audit logging
- Flash messages via secure cookies
- Automatic session creation before password form

**Error Codes:**

- `verification_failed`: Invalid or expired code
- `invalid_verification_link`: Missing code parameter

**Notes:**

- Uses PKCE flow exclusively (modern, recommended for SSR)
- Legacy OTP flow (`token_hash`) is not supported
- Auto-login happens **before** password form, allowing authenticated password update
- Both endpoints share the same rate limit configuration for consistency

---

### Development & Testing

#### Sentry Error Testing

Test endpoint for Sentry error monitoring integration.

**Endpoint:** `GET /api/sentry-example-api`

**Purpose:** Intentionally throws an error to test Sentry error tracking and monitoring.

**Response:**

- Always throws `SentryExampleAPIError`
- Used for testing error monitoring and alerting systems

**Example Request:**

```
GET /api/sentry-example-api
```

**Note:** This endpoint is for development and testing purposes only.

---

### Open Graph Image Generation

Dynamic Open Graph (OG) image generation routes used for social sharing previews.

#### Default OG Image

**Endpoint:** `GET /api/og`

**Query Parameters:**

- `title` (string, optional) — Custom title (max 100 chars)
- `description` (string, optional) — Custom description (max 200 chars)

**Behavior:**

- Returns a 1200x630 OG image via `next/og`
- Uses the project font assets from `public/fonts`
- Responds with an image body and proper cache headers

#### Profile OG Image

**Endpoint:** `GET /api/og/profile`

**Query Parameters:**

- `name` (string, optional) — Display name
- `bio` (string, optional) — Short bio
- `avatar` (string, optional) — Absolute avatar URL

**Behavior:**

- Returns a 1200x630 OG image tailored for profile previews
- Used by `getProfileOgImageUrl` in `src/config/site.ts`

---

### Social Metadata Preview

Fetches Open Graph metadata for a given external social URL.

#### Social Metadata Endpoint

**Endpoint:** `GET /api/social-metadata`

**Query Parameters:**

- `url` (string, required) — The external URL to preview

**Response:**

```json
{
  "title": "Example",
  "description": "Example description",
  "image": "https://example.com/image.jpg"
}
```

**Notes:**

- Validates URLs and blocks insecure/private targets
- Uses platform-specific OG endpoints when available
- Caches results in-memory (LRU, 1 hour)

---

## API Development Guidelines

### Adding New Endpoints

When creating new API endpoints, follow these patterns:

1. **Use the centralized error handler:**

   ```typescript
   import { withApiErrorHandler } from '@/lib/error/server'

   export const GET = withApiErrorHandler(async (request: NextRequest) => {
     // Your endpoint logic
   })
   ```

2. **Include proper logging:**

   ```typescript
   import { buildLogger } from '@/lib/logger/server'

   const logger = buildLogger('endpoint-name')

   logger.info({ context }, 'Operation description')
   ```

3. **Apply security headers:**

   ```typescript
   const response = NextResponse.json(data)
   // Security headers are applied automatically by the error handler
   return response
   ```

4. **Use proper TypeScript types:**

   ```typescript
   interface RequestBody {
     field: string
   }

   interface ResponseData {
     result: string
   }
   ```

### Error Handling Best Practices

- Use `withApiErrorHandler` wrapper for all endpoints
- Log all operations with appropriate context
- Return structured error responses
- Include operation context for debugging
- Use appropriate HTTP status codes

### Security Considerations

- All endpoints include security headers automatically
- Validate all input parameters
- Log security-relevant events (auth attempts, failures)
- Use rate limiting for sensitive endpoints
- Sanitize all user inputs

### Testing API Endpoints

1. **Unit Tests**: Test endpoint logic in isolation
2. **Integration Tests**: Test with real database connections
3. **Security Tests**: Verify security headers and input validation
4. **Error Scenarios**: Test all error conditions

Example test structure:

```typescript
describe('/api/endpoint', () => {
  it('should handle valid requests', async () => {
    // Test implementation
  })

  it('should handle invalid input', async () => {
    // Test error scenarios
  })

  it('should include security headers', async () => {
    // Test security headers
  })
})
```

## Related Documentation

- [Authentication System](../src/lib/actions/auth/README.md) - Authentication implementation details
- [Error Handling](../src/lib/error/README.md) - Centralized error handling system
- [Logging](../src/lib/logger/README.md) - Logging patterns and configuration
- [Supabase Integration](../src/lib/supabase/README.md) - Database and auth integration

## Monitoring and Observability

All API endpoints include:

- **Structured Logging**: JSON-formatted logs with context
- **Error Tracking**: Sentry integration for error monitoring
- **Performance Monitoring**: Request timing and performance metrics
- **Security Logging**: Authentication attempts and security events

For monitoring setup and configuration, see the [Architecture Documentation](./architecture.md).

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
