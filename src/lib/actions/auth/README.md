# Authentication Service

The authentication system uses **Server Actions** for all write operations (login, sign up, password management, sign out) and a **Client-Side Service** for read operations (session management, OAuth flows, auth state listeners).

## 🏗️ **Architecture**

- **Server Actions** (`src/lib/actions/auth/server.ts`): Use these for any data-modifying operation (authentication, registration, password management, sign out).
- **Client Service** (`src/lib/actions/auth/client.ts`): Use this for retrieving current session/user in Client Components, OAuth provider login, and handling auth state listeners. All write operations have been migrated to server actions.
- **Middleware** (`src/middleware/auth.ts`): Protects routes and enforces email verification requirements.

## 🚀 **Server Actions** (`@/lib/actions/auth/server`)

All server actions are wrapped with `withServerActionErrorHandling` for consistent error reporting and logging.

### **Available Actions**

- `loginWithEmail(credentials)` - Authenticates user with email and password
- `signUpWithEmail(credentials)` - Signs up new user
- `signOut()` - Clears session and signs out user
- `forgotPassword(data)` - Sends password reset email (handles both initial request and resend)
- `setPassword(data)` - Sets new password via reset token from email link
- `updatePassword(data)` - Updates password for logged-in users (requires current password)
- `resendVerification(email)` - Resends email verification link

```typescript
import {
  loginWithEmail,
  signUpWithEmail,
  forgotPassword,
  setPassword,
  updatePassword,
  signOut,
  resendVerification,
} from '@/lib/actions/auth/server'

// Login
const result = await loginWithEmail({ email, password })
if (result.success) {
  // Redirect to dashboard
}

// Sign up
const signUpResult = await signUpWithEmail({ email, password, name, confirmPassword, acceptTerms })

// Forgot password (also used for resending)
const forgotResult = await forgotPassword({ email })

// Set password (from email reset link)
const setResult = await setPassword({ password, confirmPassword })

// Update password (logged-in users)
const updateResult = await updatePassword({ currentPassword, newPassword, confirmPassword })
```

## 💻 **Client Service** (`@/lib/actions/auth/client`)

The client service now only provides read operations and OAuth flows. All write operations are performed by server actions.

**Available Operations:**

- `getSession()` - Get current session
- `getUser()` - Get current user
- `loginWithProvider(provider)` - Login with OAuth provider (Google, GitHub, Facebook)
- `refreshSession()` - Refresh current session
- `onAuthStateChange(callback)` - Subscribe to auth state changes

```typescript
import { authService } from '@/lib/actions/auth/client'

const session = await authService.getSession()
const user = await authService.getUser()
```

## 🛡️ **Middleware Protection**

Routes are protected based on the configuration in `src/config/routes.ts`.

- **Protected Routes**: Redirect unauthenticated users to `/auth`.
- **Auth Routes**: Redirect authenticated users away from login/sign-up pages.
- **Verified Email**: Enforces email confirmation for specific routes.

## 🔗 **Related Documentation**

- [Architecture Guide](../../../docs/architecture.md)
- [Route Configuration](../../config/routes.ts)
- [Middleware README](../../middleware/README.md)

---

**Last Updated**: 2025-12-28  
**Version**: 2.0.0
