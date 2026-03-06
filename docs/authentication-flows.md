# Authentication Flows

This document provides a comprehensive overview of the email-based authentication flows in the application.

## Overview

The application uses **Supabase Auth** with **PKCE (Proof Key for Code Exchange)** for secure email-based authentication. All email verification and password reset operations use a shared utility for consistency and security.

## Key Components

### Shared Email Authentication Utility

**Location:** [`/src/lib/utils/email-auth-handler.ts`](../src/lib/utils/email-auth-handler.ts)

This reusable utility handles all email-based authentication code exchanges:

```typescript
export async function handleEmailAuthCode(
  request: NextRequest,
  supabase: SupabaseClient<Database>,
  options: EmailAuthHandlerOptions
): Promise<EmailAuthHandlerResult>
```

**Features:**

- Supports `AuthOperationsEnum.SIGN_UP` and `AuthOperationsEnum.FORGOT_PASSWORD` auth types
- PKCE code validation and exchange
- Automatic session creation via `exchangeCodeForSession()`
- Security event logging
- Flash message integration
- Centralized error handling
- Configurable success messages and redirects

### API Routes

1. **Email Verification:** [`/app/api/auth/confirm/route.ts`](../app/api/auth/confirm/route.ts)
   - Handles sign-up email verification links
   - Uses `handleEmailAuthCode` with type: `AuthOperationsEnum.SIGN_UP`

2. **Password Reset:** [`/app/api/auth/reset-password/route.ts`](../app/api/auth/reset-password/route.ts)
   - Handles password reset email links
   - Uses `handleEmailAuthCode` with type: `AuthOperationsEnum.FORGOT_PASSWORD`

### Server Actions

**Location:** [`/src/lib/actions/auth/server.ts`](../src/lib/actions/auth/server.ts)

- `signUpWithEmail()` - Initiates sign-up and sends verification email
- `forgotPassword()` - Initiates password reset and sends recovery email
- `setPassword()` - Updates password after reset
- `loginWithEmail()` - Handles email/password login

## Authentication Flows

### 1. Email Verification Flow (Sign-Up)

This flow allows users to create an account and verify their email address.

```
┌─────────────┐
│ User visits │
│  /auth?op=  │
│   sign-up   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User fills sign-up form:            │
│ - Email                             │
│ - Password                          │
│ - Name                              │
│ - Accepts terms                     │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ signUpWithEmail() server action     │
│ - Validates form data               │
│ - Creates Supabase account          │
│ - Sends verification email          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Supabase sends email with link:     │
│ /api/auth/confirm?code={PKCE_CODE}  │
└──────────┬──────────────────────────┘
           │
           ▼ User clicks link
┌─────────────────────────────────────┐
│ GET /api/auth/confirm               │
│ - Rate limited (emailVerification)  │
│ - Calls handleEmailAuthCode()       │
│   with type: AuthOperationsEnum.SIGN_UP │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ handleEmailAuthCode() utility       │
│ 1. Validates PKCE code              │
│ 2. exchangeCodeForSession()         │
│ 3. Creates authenticated session    │
│ 4. Logs security event              │
│ 5. Sets flash message               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ ✅ User auto-logged in              │
│ Redirects to: /profile              │
│ Flash message: "Email verified      │
│ successfully! Welcome to your       │
│ profile."                           │
└─────────────────────────────────────┘
```

**Key Points:**

- User is automatically logged in after email verification
- No separate login step required
- Redirects to profile page with success message
- Session is established via PKCE code exchange

### 2. Password Reset Flow (Forgot Password)

This flow allows users to reset their password if they forgot it.

```
┌─────────────┐
│ User visits │
│  /auth?op=  │
│forgot-pass  │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│ User enters email address           │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ forgotPassword() server action      │
│ - Validates email                   │
│ - Sends reset email via Supabase    │
│ - redirectTo: /auth/reset-password  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ Supabase sends email with link:     │
│ /api/auth/reset-password?           │
│ code={PKCE_CODE}                    │
└──────────┬──────────────────────────┘
           │
           ▼ User clicks link
┌─────────────────────────────────────┐
│ GET /api/auth/reset-password        │
│ - Rate limited (emailVerification)  │
│ - Calls handleEmailAuthCode()       │
│   with type: AuthOperationsEnum.FORGOT_PASSWORD │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ handleEmailAuthCode() utility       │
│ 1. Validates PKCE code              │
│ 2. exchangeCodeForSession()         │
│ 3. Creates authenticated session    │
│ 4. Logs security event              │
│ 5. Sets flash message               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ ✅ User auto-logged in              │
│ Redirects to: /auth?op=set-password │
│ Flash message: "Password reset      │
│ verified. Please set your new       │
│ password."                          │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ User enters new password            │
│ - Password                          │
│ - Confirm password                  │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ setPassword() server action         │
│ - Validates password strength       │
│ - Updates password via Supabase     │
│ - Logs security event               │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│ ✅ Password updated                 │
│ Redirects to: /profile              │
│ Flash message: "Password updated    │
│ successfully"                       │
└─────────────────────────────────────┘
```

**Key Points:**

- User is automatically logged in **before** setting new password
- This allows authenticated password update via `updateUser()`
- Session is established via PKCE code exchange
- Redirects to password form, then to profile after success

## Security Features

### PKCE Flow (Proof Key for Code Exchange)

- Modern, secure authentication flow recommended for SSR applications
- Prevents authorization code interception attacks
- No secrets exposed in client-side code

### Rate Limiting

Both endpoints use the `emailVerification` rate limit:

- Prevents brute force attacks
- Configurable limits via security configuration
- Shared between both flows for consistency

### Security Event Logging

All authentication attempts are logged with:

- Event type: `'email_verification'` or `'password_reset'`
- Security context (IP, user agent, user ID)
- Success/failure status
- Detailed error information

### Flash Messages

- Success messages delivered via secure HTTP-only cookies
- Not visible in URL (prevents exposure in browser history)
- Automatically cleared after display
- Consistent UX across all flows

## Error Handling

### Common Error Codes

| Error Code                  | Description                 | When It Occurs                                    |
| --------------------------- | --------------------------- | ------------------------------------------------- |
| `invalid_verification_link` | Missing PKCE code parameter | User accesses endpoint without `code` query param |
| `verification_failed`       | Invalid or expired code     | PKCE code is invalid, expired, or already used    |

### Error Flow

```
Error Detected
     ↓
Logged as Security Event
     ↓
Redirect to /error?code={error_code}
     ↓
User sees friendly error page
```

## Configuration

### Environment Variables

```env
# Required for email authentication
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

### Routes Configuration

**Location:** [`/src/config/routes.ts`](../src/config/routes.ts)

```typescript
export const ROUTES = {
  AUTH: {
    redirectIfAuthenticated: '/profile',
    // ... other routes
  },
}
```

### Rate Limiting Configuration

**Location:** [`/src/config/security.ts`](../src/config/security.ts)

```typescript
export const RATE_LIMITS = {
  emailVerification: {
    points: 5, // 5 attempts
    duration: 900, // per 15 minutes
  },
}
```

## Implementation Guide

### Adding a New Email Auth Flow

1. **Create API Route:**

   ```typescript
   import { handleEmailAuthCode } from '@/lib/utils/email-auth-handler'

   export const GET = withRateLimit(
     'emailVerification',
     withApiErrorHandler(async (request: NextRequest) => {
       const supabase = await createClient()

       const result = await handleEmailAuthCode(request, supabase, {
         type: 'signup', // or 'recovery'
         successMessage: 'Your custom success message',
         logContext: {
           flow: 'your-custom-flow',
         },
       })

       return result.response
     })
   )
   ```

2. **Configure Email Template in Supabase:**
   - Go to Authentication > Email Templates
   - Update the confirmation URL to point to your route
   - Use `{{ .ConfirmationURL }}` for the link

3. **Update Documentation:**
   - Add flow diagram to this document
   - Update API documentation in [`docs/api.md`](./api.md)

## Testing

### Manual Testing Checklist

#### Email Verification (Sign-Up)

- [ ] User can sign up with valid email/password
- [ ] Verification email is sent
- [ ] Clicking email link auto-logs in user
- [ ] User redirected to profile with success message
- [ ] Invalid/expired code shows error page
- [ ] Rate limiting prevents abuse

#### Password Reset

- [ ] User can request password reset
- [ ] Reset email is sent
- [ ] Clicking email link auto-logs in user
- [ ] User redirected to password form
- [ ] Can set new password
- [ ] Redirected to profile after success
- [ ] Invalid/expired code shows error page
- [ ] Rate limiting prevents abuse

### End-to-End Testing

```typescript
// Example test structure (adjust for your testing framework)
describe('Email Verification Flow', () => {
  it('should verify email and auto-login user', async () => {
    // 1. Sign up
    await signUpWithEmail({ email, password, name })

    // 2. Get verification code from email
    const code = await getVerificationCodeFromEmail(email)

    // 3. Visit confirmation link
    await fetch(`/api/auth/confirm?code=${code}`)

    // 4. Assert user is logged in
    expect(await getSession()).toBeTruthy()
  })
})
```

## Troubleshooting

### Common Issues

**Issue:** User not redirected after clicking email link

- **Solution:** Check `ROUTES.AUTH.redirectIfAuthenticated` configuration
- **Solution:** Verify flash message cookies are not blocked

**Issue:** "Invalid verification link" error

- **Solution:** Check that PKCE code is present in URL
- **Solution:** Verify email template includes `{{ .ConfirmationURL }}`

**Issue:** Rate limit exceeded

- **Solution:** Adjust rate limit configuration in `security.ts`
- **Solution:** Clear rate limit storage for testing

**Issue:** Session not established after code exchange

- **Solution:** Verify Supabase configuration (URL, anon key)
- **Solution:** Check browser cookies are enabled
- **Solution:** Review security event logs for errors

## Related Documentation

- [API Documentation](./api.md) - Complete API endpoint reference
- [Security Documentation](./security.md) - Security features and configuration
- [Rate Limiting](./rate-limiting.md) - Rate limiting setup and configuration
- [Error Handling](../src/lib/error/README.md) - Error management patterns

## Changelog

### 2024-01-XX - Initial Implementation

- Created shared `handleEmailAuthCode` utility
- Implemented email verification route (`/api/auth/confirm`)
- Implemented password reset route (`/api/auth/reset-password`)
- Added comprehensive security logging
- Added flash message support
- Unified PKCE flow across all email auth operations

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
