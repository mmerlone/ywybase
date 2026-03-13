# API Endpoints Reference

This document provides reference for all HTTP API endpoints available in the YwyBase application.

## Base URL

```
https://your-domain.com/api
```

## Response Shapes

Responses vary by route type — there is no single universal envelope:

| Route type                                     | Success response                                | Error response                                |
| ---------------------------------------------- | ----------------------------------------------- | --------------------------------------------- |
| Auth routes (`/api/auth/*`)                    | HTTP 302 redirect (no JSON body)                | HTTP 302 redirect to `/error` with error code |
| OG image routes (`/api/og`, `/api/og/profile`) | Image body (`image/png`) with CDN cache headers | `{ "error": "..." }` with HTTP 500            |
| Social metadata (`/api/social-metadata`)       | `{ title?, description?, image? }`              | `{ "error": "..." }` with HTTP 400 or 500     |
| Sentry test (`/api/sentry-example-api`)        | Never succeeds — always throws                  | JSON 500 from `withApiErrorHandler`           |

All routes are wrapped with `withApiErrorHandler` from `@/lib/error/server`, which catches unhandled exceptions and returns a structured JSON 500 response. All routes are also wrapped with `withRateLimit`, which returns a structured JSON 429 response on limit exhaustion.

## Rate Limiting

All endpoints use route-level rate limiting via `withRateLimit`. The active limiter profiles are defined in `src/config/security.ts`:

| Endpoint                       | Limiter profile     | Production limit |
| ------------------------------ | ------------------- | ---------------- |
| `GET /api/auth/confirm`        | `emailVerification` | 10 req / 1 hour  |
| `GET /api/auth/reset-password` | `emailVerification` | 10 req / 1 hour  |
| `GET /api/og`                  | `api`               | 100 req / 15 min |
| `GET /api/og/profile`          | `api`               | 100 req / 15 min |
| `GET /api/social-metadata`     | `api`               | 100 req / 15 min |
| `GET /api/sentry-example-api`  | `api`               | 100 req / 15 min |

In development all limits are set to 999 (effectively disabled).

The middleware also applies a middleware-level `api` or `auth` limiter to all `/api/*` and `/auth` paths before the request reaches any route handler, providing an additional layer of protection.

**Rate limit response headers** (standard format, sent on every response):

```http
RateLimit-Limit: 100
RateLimit-Remaining: 95
RateLimit-Reset: 2026-03-11T12:00:00.000Z
```

On a 429 response the `Retry-After` header is also included:

```http
Retry-After: 300
```

**Rate limit 429 body**:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests, please try again later",
    "limit": 100,
    "remaining": 0,
    "resetTime": 1741694400000,
    "retryAfter": 300
  }
}
```

## Security Headers

All responses pass through the security middleware, which adds:

- `Content-Security-Policy` (nonce-based)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (production only)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Resource-Policy: same-site`
- `Permissions-Policy`

---

## Authentication Endpoints

Both auth endpoints act as PKCE code-exchange handlers. They receive a one-time code from a Supabase-generated email link, exchange it for a session, and then redirect. They do not return JSON and do not require a pre-existing session.

### Email Verification

**Endpoint:** `GET /api/auth/confirm`

Handles email verification links from the sign-up flow.

**Query parameters:**

| Name   | Type   | Required | Description                                |
| ------ | ------ | -------- | ------------------------------------------ |
| `code` | string | Yes      | PKCE verification code from the email link |

**Response:**

- **Success**: HTTP 302 redirect to `/profile` with a success flash message cookie
- **Error**: HTTP 302 redirect to `/error` with an error code in the URL

**Example:**

```
GET /api/auth/confirm?code=pkce-verification-code-here
```

**Rate limiting:** `emailVerification` profile (10 req / hr)

---

### Password Reset

**Endpoint:** `GET /api/auth/reset-password`

Handles password reset links from the forgot-password flow.

**Query parameters:**

| Name   | Type   | Required | Description                         |
| ------ | ------ | -------- | ----------------------------------- |
| `code` | string | Yes      | PKCE reset code from the email link |

**Response:**

- **Success**: HTTP 302 redirect to `/auth?op=set-password`
- **Error**: HTTP 302 redirect to `/error` with an error code in the URL

**Example:**

```
GET /api/auth/reset-password?code=pkce-reset-code-here
```

**Rate limiting:** `emailVerification` profile (10 req / hr)

---

## Open Graph Image Generation

Dynamic Open Graph image generation routes for social sharing previews. Both routes:

- Run on the **Node.js runtime** (not Edge) to enable filesystem access for font loading
- Return an image body directly — **not** a JSON response — on success
- Are cached by CDN via the response headers set by `ImageResponse`

### Default OG Image

**Endpoint:** `GET /api/og`

Generates a generic branded OG image for the application.

**Query parameters:**

| Name          | Type   | Required | Default                             | Constraint             |
| ------------- | ------ | -------- | ----------------------------------- | ---------------------- |
| `title`       | string | No       | Site title from `SITE_CONFIG`       | Truncated to 100 chars |
| `description` | string | No       | Site description from `SITE_CONFIG` | Truncated to 200 chars |

**Response (success):**

- **Content-Type**: `image/png`
- **Dimensions**: 1200 × 630 px
- **Body**: Binary image data (not JSON)

**Response (error):**

```json
{ "error": "Failed to generate image" }
```

HTTP status 500.

**Example:**

```
GET /api/og
GET /api/og?title=Custom%20Title&description=Custom%20description
```

**Rate limiting:** `api` profile (100 req / 15 min)

---

### Profile OG Image

**Endpoint:** `GET /api/og/profile`

Generates a personalized OG image for a user profile page.

**Query parameters:**

| Name     | Type   | Required | Default              | Constraint                         |
| -------- | ------ | -------- | -------------------- | ---------------------------------- |
| `name`   | string | Yes      | —                    | Displayed as heading               |
| `avatar` | string | No       | Initials placeholder | Must pass `isValidAvatarUrl` check |
| `bio`    | string | No       | Hidden               | Truncated to 150 chars             |

**Response (success):**

- **Content-Type**: `image/png`
- **Dimensions**: 1200 × 630 px
- **Body**: Binary image data (not JSON)

**Response (missing `name`):**

```json
{ "error": "Missing required parameter: name" }
```

HTTP status 400.

**Example:**

```
GET /api/og/profile?name=John%20Doe
GET /api/og/profile?name=John%20Doe&avatar=https%3A%2F%2F...&bio=Full%20Stack%20Dev
```

**Rate limiting:** `api` profile (100 req / 15 min)

---

## Social Metadata Preview

### Social Metadata

**Endpoint:** `GET /api/social-metadata`

Fetches Open Graph metadata for an external social profile URL.

> **Prefer the Server Action**: For calls originating within the application, use the `fetchSocialMetadata` Server Action in `src/lib/actions/social.ts` instead — it skips the HTTP round-trip.

**Query parameters:**

| Name  | Type   | Required | Description                                          |
| ----- | ------ | -------- | ---------------------------------------------------- |
| `url` | string | Yes      | External social profile URL to fetch OG metadata for |

The URL is validated with `isValidSocialUrl` against the platform config before any fetch is performed.

Note: Server-side HTML scraping within the application is disabled for generic `website` previews to avoid SSRF risks. The repository includes a Cloudflare Metadata Proxy (`workers/metadata-worker`) for safe external metadata extraction; the worker and validators block loopback, `.local`, private IPv4 ranges, and common IPv6 literals. Prefer `fetchSocialMetadata` Server Action or the metadata worker for external previews.

**Response (success):**

```json
{ "title": "...", "description": "...", "image": "..." }
```

Fields are optional — a platform may return any subset. There is no `success` wrapper.

**Response (invalid URL):**

```json
{ "error": "Invalid or insecure URL" }
```

HTTP status 400.

**Response (fetch failure):**

```json
{ "error": "Failed to fetch preview - the site may be blocking automated requests" }
```

HTTP status 500. This is a soft error — the site was reachable but blocked or returned no metadata.

**Example:**

```
GET /api/social-metadata?url=https%3A%2F%2Fgithub.com%2Fusername
```

**Rate limiting:** `api` profile (100 req / 15 min)

---

## Development & Testing

### Sentry Error Testing

**Endpoint:** `GET /api/sentry-example-api`

Test endpoint for confirming Sentry error monitoring is wired up correctly.

**Query parameters:** None. The endpoint ignores all query parameters.

**Response:** Always throws a `SentryExampleAPIError`, which is caught by `withApiErrorHandler` and forwarded to Sentry. The caller receives a JSON 500 error response.

**Note:** This endpoint is available in all environments (not just development). It is protected like all other API routes with the `api` rate limiter.

**Example:**

```
GET /api/sentry-example-api
```

**Rate limiting:** `api` profile (100 req / 15 min)

---

## Using curl

```bash
# Trigger email verification (code from Supabase email)
curl -I "https://your-domain.com/api/auth/confirm?code=test-code"

# Fetch OG image (binary PNG response)
curl -I "https://your-domain.com/api/og"

# Fetch OG image with params
curl -I "https://your-domain.com/api/og?title=My+Title"

# Fetch social metadata
curl "https://your-domain.com/api/social-metadata?url=https%3A%2F%2Fgithub.com%2Fusername"
```

## Related Documentation

- [Server Actions Reference](./server-actions.md) - Server-side operations
- [Authentication Flows](/docs/authentication-flows.md) - Complete auth flow documentation
- [API Development Guide](/docs/developer-guides/api-development.md) - Implementation patterns
- [Rate Limiting](/docs/rate-limiting.md) - Store setup and production configuration
- [Security Documentation](/docs/security.md) - Security best practices

---

**Last Updated**: March 11, 2026
**Version**: 2.0.0
