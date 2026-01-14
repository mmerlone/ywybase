# Security Utilities

## Overview

The security utilities provide a consistent interface for implementing security measures across the application:

```
src/middleware/security/
├── README.md              # This documentation
├── headers.ts             # Security headers management
├── sanitize.ts            # Input sanitization utilities
├── rate-limit.ts          # Rate limiting middleware
├── csrf.ts                # CSRF protection
└── audit.ts               # Security audit logging
```

## Quick Start

```typescript
import { applySecurityHeaders } from '@/middleware/security/headers'
import { sanitizeInput } from '@/middleware/security/sanitize'
import { rateLimiter } from '@/middleware/security/rate-limit'
import { validateCsrfToken } from '@/middleware/security/csrf'
import { logSecurityEvent } from '@/middleware/security/audit'

// Apply security headers to response
const secureResponse = applySecurityHeaders(response)

// Sanitize user input
const cleanInput = sanitizeInput(userInput)

// Apply rate limiting (returns NextResponse with headers)
const rateLimitedResponse = await rateLimiter(request, response, 'api')

// Validate CSRF token
const isValidCsrf = validateCsrfToken(request)

// Log security event
logSecurityEvent('login_attempt', { userId, ip })
```

## Type Safety

All security utilities use comprehensive TypeScript types from `@/types/security.types`:

```typescript
import type {
  SecurityEventType,
  SecurityEventContext,
  RateLimitResult,
  FileValidationResult,
  SecurityHeadersOptions,
} from '@/types/security.types'
```

## Modules

### headers.ts

Security headers management using configuration from `src/config/security.ts`.

**Key Functions:**

- `applySecurityHeaders()` - Apply all security headers to response
- `generateCSPNonce()` - Generate CSP nonce for inline scripts
- `setSecureCookie()` - Set cookies with security configuration

### sanitize.ts

Input sanitization utilities to prevent XSS and injection attacks.

**Key Functions:**

- `sanitizeHtml()` - Clean HTML content
- `sanitizeInput()` - General input sanitization
- `validateAndSanitizeFile()` - File upload validation and sanitization

### rate-limit.ts

Rate limiting middleware with configurable limits per endpoint type.

**Key Functions:**

- `rateLimiter()` - Apply rate limiting based on endpoint type
- `createRateLimiter()` - Create custom rate limiter
- `getRateLimitStatus()` - Check current rate limit status

### csrf.ts

CSRF protection utilities for form submissions and API calls.

**Key Functions:**

- `generateCsrfToken()` - Generate CSRF token
- `validateCsrfToken()` - Validate CSRF token
- `csrfMiddleware()` - CSRF protection middleware

### audit.ts

Security audit logging with PII sanitization and event categorization.

**Key Functions:**

- `logSecurityEvent()` - Log security events with proper sanitization
- `auditUserAction()` - Audit user actions
- `createAuditTrail()` - Create comprehensive audit trail

## Integration with Middleware

```typescript
// src/middleware.ts
import { applySecurityHeaders } from '@/middleware/security/headers'
import { rateLimiter } from '@/middleware/security/rate-limit'
import { csrfMiddleware } from '@/middleware/security/csrf'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next()

  // Apply security layers
  response = applySecurityHeaders(response)
  response = await rateLimiter(request, response, 'api')
  response = await csrfMiddleware(request, response)

  return response
}
```

## Configuration

All security utilities use the configuration from `src/config/security.ts`:

```typescript
import { SECURITY_CONFIG } from '@/config/security'

// Access configuration
const headers = SECURITY_CONFIG.headers
const rateLimit = SECURITY_CONFIG.rateLimit
const validation = SECURITY_CONFIG.validation

/**
 * Security configuration interface with all available options
 */
interface SecurityConfig {
  /**
   * HTTP security headers configuration
   */
  headers: {
    // Security Headers
    strictTransportSecurity: {
      enabled: boolean
      maxAge?: number // in seconds, default: 15552000 (180 days)
      includeSubDomains?: boolean
      preload?: boolean
    }
    xFrameOptions: {
      enabled: boolean
      value: 'DENY' | 'SAMEORIGIN'
    }
    xContentTypeOptions: {
      enabled: boolean
      nosniff: boolean
    }
    xXSSProtection: {
      enabled: boolean
      modeBlock: boolean // If true, enables XSS filtering and blocks the page if attack detected
    }
    contentSecurityPolicy: {
      enabled: boolean
      directives: Record<string, string[]> // CSP directives
      reportOnly?: boolean
    }
    referrerPolicy: {
      enabled: boolean
      policy?:
        | 'no-referrer'
        | 'no-referrer-when-downgrade'
        | 'origin'
        | 'origin-when-cross-origin'
        | 'same-origin'
        | 'strict-origin'
        | 'strict-origin-when-cross-origin'
        | 'unsafe-url'
    }
    permissionsPolicy: {
      enabled: boolean
      features: Record<string, string[]> // Feature policies
    }
  }

  /**
   * Rate limiting configuration
   */
  rateLimit: {
    enabled: boolean
    windowMs: number // Time window in milliseconds
    max: number // Max requests per window per IP
    message?: string // Error message when limit is reached
    statusCode?: number // HTTP status code when limit is reached (default: 429)
    skipSuccessfulRequests?: boolean // Don't count successful requests
    keyGenerator?: (req: Request) => string // Custom key generator function
  }

  /**
   * Request validation configuration
   */
  validation: {
    enabled: boolean
    // Request body validation
    body: {
      enabled: boolean
      maxSize?: string // e.g., '1mb', '10kb'
      strict: boolean // Reject unknown fields
    }
    // Request query parameters validation
    query: {
      enabled: boolean
      strict: boolean // Reject unknown query parameters
    }
    // Request parameters validation (route params)
    params: {
      enabled: boolean
      strict: boolean // Reject unknown parameters
    }
    // Custom validation rules
    rules: Array<{
      path: string // Path to validate (e.g., 'body.email', 'query.page')
      required?: boolean
      type?: 'string' | 'number' | 'boolean' | 'array' | 'object'
      min?: number
      max?: number
      pattern?: string | RegExp
      custom?: (value: any) => boolean
      message?: string // Custom error message
    }>
  }

  /**
   * CORS configuration
   */
  cors: {
    enabled: boolean
    origin: string | string[] | ((origin: string) => boolean)
    methods?: string[] // Allowed HTTP methods
    allowedHeaders?: string[]
    exposedHeaders?: string[]
    credentials?: boolean
    maxAge?: number // in seconds
  }
}
```

## Testing

Each utility module includes comprehensive tests:

```bash
# Run security utility tests
npm test src/middleware/security/

# Run specific module tests
npm test src/middleware/security/headers.test.ts
npm test src/middleware/security/sanitize.test.ts
```

## Best Practices

1. **Always use configuration** from `src/config/security.ts`
2. **Log security events** using the audit utilities
3. **Validate inputs** before processing
4. **Apply rate limiting** to all public endpoints
5. **Use CSRF protection** for state-changing operations
6. **Sanitize all user inputs** before storage or display

## Related Documentation

## Related Documentation

- [Security Documentation](../../docs/security.md) - Comprehensive security guide
- [Security Configuration](../../config/security.ts) - Security config
- [Security Types](../../types/security.types.ts) - TypeScript type definitions
- [API Documentation](../../docs/api.md) - API security implementation
