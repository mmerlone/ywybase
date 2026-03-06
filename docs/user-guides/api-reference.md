# API Endpoints Reference

This document provides comprehensive reference for all HTTP API endpoints available in the YwyBase application.

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
// Success Response
{
  "success": true,
  "data": { /* actual data */ },
  "message": "Operation completed successfully"
}

// Error Response
{
  "success": false,
  "error": "Error description",
  "code": "ERROR_CODE",
  "details": { /* additional error context */ }
}
```

## Security Headers

All API responses include comprehensive security headers:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`

## Authentication Endpoints

### Email Verification

**Endpoint:** `GET /api/auth/confirm`

Handles email verification links from sign-up flow.

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

**Error Codes:**

- `verification_failed`: Invalid or expired code
- `invalid_verification_link`: Missing code parameter

### Password Reset

**Endpoint:** `GET /api/auth/reset-password`

Handles password reset links from forgot password flow.

**Parameters:**

- `code` (string, required): The PKCE verification code from the email link

**Response:**

- **Success**: Auto-logs in user, redirects to password reset form
- **Error**: Redirects to `/error` with error code

**Example Request:**

```
GET /api/auth/reset-password?code=pkce-reset-code-here
```

**Security Features:**

- PKCE verification
- Rate limiting (emailVerification)
- Secure token exchange

**Error Codes:**

- `reset_failed`: Invalid or expired reset code
- `invalid_reset_link`: Missing code parameter

## Open Graph Image Generation

Dynamic Open Graph (OG) image generation routes used for social sharing previews.

### Default OG Image

**Endpoint:** `GET /api/og`

Generates a default OG image for the application.

**Parameters:**

- None required

**Response:**

- **Content-Type**: `image/png`
- **Cache Headers**: Optimized for CDN caching
- **Image Body**: PNG image data

**Features:**

- Uses the project font assets from `public/fonts`
- Responds with an image body and proper cache headers

**Example Request:**

```
GET /api/og
```

### Profile OG Image

**Endpoint:** `GET /api/og/profile`

Generates personalized OG image for user profiles.

**Parameters:**

- `username` (string, optional): Username for profile
- `theme` (string, optional): Theme for image styling

**Response:**

- **Content-Type**: `image/png`
- **Cache Headers**: User-specific caching
- **Image Body**: Personalized PNG image

**Example Request:**

```
GET /api/og/profile?username=johndoe&theme=dark
```

## Social Metadata Preview

### Social Metadata Endpoint

**Endpoint:** `GET /api/social-metadata`

Fetches Open Graph metadata for a given external social URL.

**Parameters:**

- `url` (string, required): URL to fetch metadata for

**Response:**

```typescript
{
  "success": true,
  "data": {
    "title": string,
    "description": string,
    "image": string,
    "siteName": string,
    "url": string
  }
}
```

**Example Request:**

```
GET /api/social-metadata?url=https://example.com/article
```

**Example Response:**

```json
{
  "success": true,
  "data": {
    "title": "Article Title",
    "description": "Article description",
    "image": "https://example.com/image.jpg",
    "siteName": "Example Site",
    "url": "https://example.com/article"
  }
}
```

**Security Features:**

- URL validation
- Content sanitization
- Rate limiting
- Timeout protection

**Error Codes:**

- `invalid_url`: Invalid URL format
- `fetch_failed`: Unable to fetch URL
- `no_metadata`: No OG metadata found

## Development & Testing

### Sentry Error Testing

**Endpoint:** `GET /api/sentry-example-api`

Test endpoint for Sentry error monitoring integration.

**Parameters:**

- `type` (string, optional): Error type to generate
  - `error`: Standard error
  - `exception`: Exception with context
  - `message`: Simple message error

**Response:**

- **Success**: Returns test data
- **Error**: Triggers Sentry error capture

**Example Request:**

```
GET /api/sentry-example-api?type=error
```

**Usage:**

```typescript
// Test error monitoring
fetch('/api/sentry-example-api?type=error')
  .then((res) => res.json())
  .then((data) => console.log(data))
```

**Security:**

- Only available in development environment
- Rate limited for testing
- Does not expose sensitive data

## Rate Limiting

All endpoints include rate limiting with these categories:

| Category            | Limits              | Purpose                        |
| ------------------- | ------------------- | ------------------------------ |
| `emailVerification` | 5 requests/minute   | Email verification/reset flows |
| `socialMetadata`    | 20 requests/minute  | Social metadata fetching       |
| `ogGeneration`      | 100 requests/minute | OG image generation            |
| `default`           | 100 requests/minute | General API usage              |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Response Headers

### Standard Headers

All endpoints include these standard headers:

```http
Content-Type: application/json
Cache-Control: private, no-cache
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

### Cache Headers

Different endpoints use different caching strategies:

```http
# Static content (OG images)
Cache-Control: public, max-age=31536000, immutable

# User-specific content
Cache-Control: private, no-cache

# API responses
Cache-Control: private, max-age=300
```

## CORS Configuration

API endpoints are configured for secure cross-origin requests:

```http
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## Webhook Support

### Webhook Security

For webhook endpoints, implement these security measures:

```typescript
// Verify webhook signature
const signature = request.headers.get('x-webhook-signature')
const payload = await request.text()

if (!verifyWebhookSignature(payload, signature)) {
  return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
}
```

### Webhook Processing

```typescript
export const POST = withRateLimit(
  'webhook-processing',
  withApiErrorHandler(async (request: NextRequest) => {
    const signature = request.headers.get('x-webhook-signature')
    const payload = await request.text()

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 401 })
    }

    // Process webhook
    const event = JSON.parse(payload)
    await processWebhookEvent(event)

    return NextResponse.json({ success: true })
  })
)
```

## API Versioning

Current API version: **v1**

Version is specified in the URL path:

```
/api/v1/endpoint
```

Future versions will be:

```
/api/v2/endpoint
```

Backward compatibility is maintained for at least one previous version.

## Testing API Endpoints

### Using curl

```bash
# Test email verification
curl "https://your-domain.com/api/auth/confirm?code=test-code"

# Test OG image generation
curl -I "https://your-domain.com/api/og"

# Test social metadata
curl "https://your-domain.com/api/social-metadata?url=https://example.com"
```

### Using JavaScript

```javascript
// Fetch social metadata
const response = await fetch('/api/social-metadata?url=https://example.com')
const data = await response.json()

console.log(data.success ? data.data : data.error)
```

### Error Handling

```javascript
try {
  const response = await fetch('/api/endpoint')
  const data = await response.json()

  if (!data.success) {
    console.error('API Error:', data.error)
    // Handle error appropriately
  }
} catch (error) {
  console.error('Network Error:', error)
}
```

## Monitoring and Observability

All API endpoints include:

- **Request Logging**: All requests logged with context
- **Error Tracking**: Errors sent to Sentry with full context
- **Performance Metrics**: Response times and success rates
- **Rate Limit Monitoring**: Rate limit violations tracked

### Request Context

Each request includes this context in logs:

```typescript
{
  "requestId": "uuid",
  "method": "GET",
  "path": "/api/endpoint",
  "userAgent": "Mozilla/5.0...",
  "ip": "client-ip",
  "userId": "authenticated-user-id",
  "duration": 123,
  "status": 200
}
```

## Related Documentation

- [Server Actions Reference](./server-actions.md) - Server-side operations
- [Authentication Flows](/docs/authentication-flows.md) - Complete auth flow documentation
- [API Development Guide](/docs/developer-guides/api-development.md) - Development patterns
- [Security Documentation](/docs/security.md) - Security best practices
- [Error Handling](/src/lib/error/README.md) - Centralized error handling

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
