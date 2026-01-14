# GitHub Copilot Instructions for YwyBase

## Critical Package Management

**ALWAYS use `pnpm`** - Never use npm or yarn. All commands: `pnpm add`, `pnpm remove`, `pnpm run`.

## Architecture Overview

**Clean Layered Architecture**: `Components → Services → Database`

- Services use **explicit dependency injection** (pass Supabase client directly)
- No factories or magic patterns - direct instantiation
- Clear server/client boundaries (Server Components default, "use client" only when needed)
- Service layer in `src/lib/supabase/services/` inherits from `BaseService` with built-in error handling

**Tech Stack**: Next.js 15 App Router, React 18 Server Components, TypeScript strict mode, MUI v7 + Tailwind CSS, Supabase (auth/DB), React Query v5, Pino logging, Sentry error tracking.

## File Naming & Structure

- Components: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- Hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- Utils/Services: `camelCase.ts` (e.g., `formatDate.ts`)
- Scripts: `kebab-case.ts` (e.g., `generate-supabase-types.ts`)
- Routes: kebab-case directories (e.g., `app/user-profile/page.tsx`)

**Import Order**: External libs → Internal (`@/*`) → Relative → Types-only

## Critical Development Workflows

### Type Generation (Run after DB schema changes)

```bash
pnpm run gen:types  # Generates src/types/supabase.ts from Supabase schema
```

### Database Migrations

```bash
pnpm run db:init           # Apply migrations to remote DB
pnpm run db:init --status  # Check migration status
```

### Code Quality (Auto-runs on commit via Husky)

```bash
pnpm run lint        # ESLint check
pnpm run type-check  # TypeScript validation
pnpm run format      # Prettier formatting
```

## Project-Specific Patterns

### Error Handling (Critical - Different from Standard Practices)

**Use centralized error system** (`src/lib/error/`):

- Services: Use `this.handleError(error, 'operation-name', { context })` from `BaseService`
- Server Actions: Wrap with `withServerActionErrorHandling(async () => {...}, { operation: 'name' })`
- Client: Use `handleClientError(error, { operation: 'name' })`
- **Never catch just to log** - global handler does this automatically

### Logging Pattern (Pino - Argument Order Matters)

```typescript
// CORRECT:
logger.info({ userId: 123 }, 'User logged in')
logger.error({ error, userId }, 'Operation failed')

// WRONG (causes TypeScript errors):
logger.info('User logged in', { userId: 123 })
```

### Form Handling Pattern

- **React Hook Form + Zod** for all forms
- **Auto-save**: Binary/multi-select inputs (no save button)
- **Manual save**: Text/image inputs with button states: "Save" → "Saving..." → "Saved" (disabled while saving/unchanged)

### Authentication Flow

- Server Components/API Routes: Use `await createClient()` from `@/lib/supabase/server`
- Client Components: Use `createClient()` from `@/lib/supabase/client`
- Middleware: Use middleware-specific client from `@/lib/supabase/middleware`
- **Never mix client types** - each context has its own factory

### Database Operations

- **TypeScript types**: Always use generated types from `src/types/supabase.ts`
- **Timestamps**: Database manages `created_at`/`updated_at` automatically - never set manually
- **Service pattern**: Extend `BaseService` for database operations with automatic error handling

### React Query Integration

- Always include TypeScript types for queries/mutations
- Configure `staleTime` and `gcTime` appropriately (see `src/config/query.ts`)
- Use optimistic updates with `onMutate` and rollback in `onError`
- **Pass parameters directly to hooks** (e.g., `useProfile(userId)`) - avoid context dependencies

### Component Patterns

- **Server Components default** - only use "use client" for interactivity/hooks/browser APIs
- **Explicit return types** required for all functions (ESLint enforced)
- Props: Define explicit interfaces, avoid `any`/`unknown`
- Co-locate helper functions inside components when possible

### Styling Approach

- MUI v7 with Pigment CSS for components
- Tailwind CSS for utility classes and layout
- `sx` prop for one-off MUI styles
- Use `cn()` utility (from `src/lib/utils/cn.ts`) for className merging

## API Routes Pattern

**Location**: `app/api/` - All API routes use Next.js 15 App Router conventions

**Structure**:

```
app/api/
├── auth/
│   ├── confirm/route.ts          # Email verification handler (PKCE code exchange)
│   └── reset-password/route.ts   # Password reset handler (PKCE code exchange)
└── sentry-example-api/route.ts   # Sentry error testing endpoint
```

**Required Pattern**:

- Use `withApiErrorHandler` wrapper for all routes (from `@/lib/error/server`)
- Use `withRateLimit` for authentication endpoints (from `@/middleware/security/rate-limit`)
- Always use Supabase server client: `await createClient()` from `@/lib/supabase/server`
- Return `NextResponse` for proper HTTP responses
- Use `handleEmailAuthCode` utility for PKCE flows (from `@/lib/utils/email-auth-handler`)

**Example**:

```typescript
import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'
import { createClient } from '@/lib/supabase/server'

export const GET = withRateLimit(
  'operationName',
  withApiErrorHandler(async (request: NextRequest) => {
    const supabase = await createClient()
    // ... your logic
    return NextResponse.json({ success: true })
  })
)
```

**Authentication Flow**:

- Email verification: User clicks email link → `/api/auth/confirm` → PKCE exchange → Auto-login → Redirect to `/profile`
- Password reset: User clicks email link → `/api/auth/reset-password` → PKCE exchange → Auto-login → Redirect to `/auth?op=set-password`

## Key Files & Integration Points

- **Service Layer**: `src/lib/supabase/services/` - All services extend `BaseService` with DI pattern
- **Error System**: `src/lib/error/` - Centralized error handling with domain-specific codes
- **Validation**: `src/lib/validators/` - Zod schemas for all inputs
- **Middleware**: `src/middleware/` - Auth, session, request logging, security headers
- **Config**: `src/config/` - Query config, routes, security settings, site config
- **Server Actions**: `src/lib/actions/` - Type-safe server actions with error handling
- **API Routes**: `app/api/` - PKCE auth handlers with error/rate-limit wrappers
- **Flash Messages**: Cookie-based temporary notifications (see `docs/flash-messages.md`)

## Deployment (Vercel)

**Build Configuration**:

- Next.js standalone output mode (automatically configured)
- Source maps disabled in production (`productionBrowserSourceMaps: false`)
- Image optimization enabled (`images.unoptimized: false`)

**Required Environment Variables** (Vercel Dashboard):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_SECRET_KEY=your_secret_key  # Server-side only
CSRF_SECRET=your_32_char_secret      # Required for production
```

**Optional but Recommended**:

```bash
# Rate Limiting (Vercel KV recommended)
KV_REST_API_URL=your_vercel_kv_url
KV_REST_API_TOKEN=your_kv_token

# Error Tracking
SENTRY_AUTH_TOKEN=your_token
NEXT_PUBLIC_SENTRY_DSN=your_dsn

# Geolocation
IPGEOLOCATION_API_KEY=your_key
```

**Deployment Steps**:

1. Push to GitHub: `git push origin main`
2. Connect repository to Vercel
3. Add environment variables in Vercel Dashboard
4. Deploy automatically on push (Vercel handles build)

**Production Considerations**:

- **Rate Limiting**: Configure Vercel KV for distributed rate limiting (in-memory only works for single instance)
- **CSRF Protection**: CSRF_SECRET is required in production, app will fail to start without it
- **Sentry**: Configure for error tracking and performance monitoring
- **Security Headers**: Automatically applied via `next.config.mjs`

## Common Commands

```bash
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build            # Production build
pnpm run gen:types    # Generate Supabase types
pnpm run db:init      # Apply DB migrations
pnpm run lint:fix     # Auto-fix ESLint issues
pnpm run format       # Format with Prettier
```

## Documentation References

- Architecture: `docs/architecture.md`
- Project Structure: `docs/structure.md`
- Auth Flows: `docs/authentication-flows.md`
- Security: `docs/security.md`
- Rate Limiting: `docs/rate-limiting.md`
- Library Docs: `src/lib/README.md`, `src/hooks/README.md`
- Scripts: `scripts/README.md`

## Unique Conventions

1. **JSDoc Required**: All exported functions, interfaces, and types must have comprehensive JSDoc comments
2. **Explicit Service Clients**: Services require Supabase client as constructor parameter (no global instances)
3. **Error Context**: Every error handler call must include operation name and relevant context
4. **Flash Messages**: Use cookie-based system for post-redirect notifications (not URL params)
5. **Multi-Theme Support**: Dynamic theme switching via `src/themes/` registry pattern
6. **Validation at Edge**: Zod validation in Server Actions and API routes before database operations
7. **Structured Logging**: All log entries include context object as first parameter with operation metadata
