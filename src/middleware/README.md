# Middleware Library

Application-specific middleware for Next.js applications, providing security, authentication, and request processing.

## **Available Middleware**

### Security Middleware (`src/middleware/security/`)

- **Security Headers** (`headers.ts`) - Security header management with CSP, HSTS, etc.
- **Rate Limiting** (`rate-limit.ts`) - Configurable rate limiting for different endpoints
- **CSRF Protection** (`csrf.ts`) - Cross-site request forgery protection
- **Input Sanitization** (`sanitize.ts`) - XSS prevention and input validation
- **Audit Logging** (`audit.ts`) - Security event logging

### Application Middleware

- `auth.ts` - Authentication and authorization middleware
- `request-logger.ts` - Request logging middleware

## 🔧 **Application Middleware Details**

### Authentication Middleware (`auth.ts`)

**NEW**: Comprehensive authentication and authorization system using centralized route configuration.

```typescript
import { requireAuth } from '@/middleware/auth'

// Apply authentication checks
const authResponse = await requireAuth(request)
if (authResponse.status >= 300 && authResponse.status < 400) {
  return authResponse // Handle redirects
}
```

**Features:**

- **Centralized Route Protection**: Uses `@/config/routes.ts` for single source of truth
- **Authentication Checks**: Validates user sessions for protected routes
- **Email Verification**: Enforces email verification where required
- **Auth Route Redirects**: Redirects authenticated users from auth pages
- **Type Safety**: Full TypeScript support with proper type guards
- **Server-Side Only**: All protection happens before client code execution

**Protected Routes:**

- `/profile` - Requires authentication and email verification
- `/dashboard` - Requires authentication and email verification
- `/account` - Requires authentication and email verification
- `/settings` - Requires authentication and email verification
- `/admin` - Requires authentication (admin role - all users treated as admin until RBAC)

**Auth Routes:**

- `/auth` - Redirects authenticated users to `/profile`

**Note:** Email confirmation is handled by `/api/auth/confirm` API route, not a page route.

### Request Logger (`request-logger.ts`)

Logs HTTP requests with metadata for monitoring and debugging.

```typescript
import { requestLoggerMiddleware } from '@/middleware/request-logger'

// Apply to all requests (non-blocking)
requestLoggerMiddleware(request, response).catch(console.error)
```

**Features:**

- Logs request method, URL, IP, and user agent
- Non-blocking operation
- Structured logging with context

## 📖 **Documentation**

For detailed documentation on the security system, see:

- `src/middleware/security/README.md` - Security middleware documentation
- `docs/security.md` - Security architecture and best practices
- `src/config/security.ts` - Security configuration

## 🤝 **Contributing**

When adding new middleware:

1. **Security First** - Place security-related middleware in `src/middleware/security/`
2. **Type Safety** - Use proper TypeScript types and interfaces
3. **Error Handling** - Implement comprehensive error handling and logging
4. **Testing** - Include unit and integration tests
5. **Documentation** - Update README and add JSDoc comments

## 🔄 **Middleware Execution Order**

1. Security Headers
2. Session Management
3. Rate Limiting
4. CSRF Protection
5. Authentication & Authorization
6. Request Logging

---

**Last Updated**: December 2025  
**Version**: 2.0.0
