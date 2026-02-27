# AGENTS.md

This file provides guidance to LLM or SML tools when working with code in this repository.

## Commands

```bash
# Development
pnpm dev                    # Start dev server with pino-pretty logging
pnpm build                  # Production build
pnpm start                  # Start production server

# Code quality (run after every task)
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix ESLint issues
pnpm type-check             # TypeScript validation
pnpm format                 # Format with Prettier

# Database
pnpm gen:types              # Generate TypeScript types from Supabase schema
pnpm db:init                # Apply migrations to remote database
pnpm db:init --status       # Check migration status

# Other
pnpm test                   # Run test suite
pnpm gen:themes             # Regenerate theme index after adding/removing themes
pnpm backup:db              # Generate Supabase schema backups
pnpm format:check           # Check formatting without changes

```

**Package Manager**: Always use `pnpm`. Never use npm or yarn.

## GIT operations

**NEVER change the repository state unless explicitly asked to!**

## Architecture

**Data Flow**: `Components → Hooks → Server Actions → Database`

### Server Actions (Primary Pattern)

All data mutations use Server Actions in `src/lib/actions/`. Wrap with the centralized error handler:

```typescript
export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: Partial<Profile>): Promise<AuthResponse<Profile>> => {
    const validated = profileUpdateSchema.safeParse(updates)
    if (!validated.success) return { success: false, error: 'Invalid data' }

    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').update(validated.data).eq('id', userId).select().single()
    if (error) throw error
    return createServerActionSuccess(data, 'Profile updated')
  }
)
```

### Supabase Clients

Each context has its own factory - never mix them:

- **Server Components/Actions**: `await createClient()` from `@/lib/supabase/server`
- **Client Components**: `createClient()` from `@/lib/supabase/client`
- **Middleware**: Use client from `@/lib/supabase/middleware`

### Component Patterns

- **Server Components by default** - only add `"use client"` for interactivity, hooks, or browser APIs
- **React Query** for client state - use hooks in `src/hooks/` that wrap Server Actions
- **Forms**: React Hook Form + Zod validation schemas from `src/lib/validators/`

## Coding Standards

### TypeScript

- **Explicit return types required** on all functions (ESLint enforced)
- Avoid type casts, unless necessary and on data conversion functions.
- Cast `as any` or `as unknown as` is forbidden by eslint rules.
- Use generated types from `src/types/supabase.ts` for database operations
- Validate all inputs with Zod schemas

### Logging (Pino - Context First)

```typescript
// CORRECT - context object first, then message
logger.info({ userId, op: 'updateProfile' }, 'Profile updated')
logger.error({ error, userId }, 'Operation failed')

// WRONG - causes TypeScript errors
logger.info('Profile updated', { userId })
```

### Error Handling

Use centralized error system in `src/lib/error/`:

- **Server Actions**: `withServerActionErrorHandling(async () => {...}, { operation: 'name' })`
- **API Routes**: `withApiErrorHandler` wrapper
- **Client**: `handleClientError(error, { operation: 'name' })`
- Never catch just to log - global handler does this automatically

### Import Order

1. External libraries (React, Next.js, MUI)
2. Internal modules (`@/*`)
3. Relative imports (`./`, `../`)
4. Types-only imports

### File Naming

- Components: `PascalCase.tsx`
- Hooks: `camelCase.ts` with `use` prefix
- Utils/Services: `camelCase.ts`
- Routes: `kebab-case` directories

### Styling

- MUI v7 with Pigment CSS for components
- Tailwind CSS for utility classes
- `sx` prop for one-off MUI styles
- Use `cn()` utility from `src/lib/utils.ts` for className merging

## Post-Task Process

After completing any coding task:

1. **Run lint**: `pnpm lint` - fix all issues
2. **Run type-check**: `pnpm type-check` - fix all errors
3. **Run build** (if config changed): `pnpm build`

## Commit Guidelines

- **Group by feature/domain** - each commit addresses a single logical change
- **Lowercase semantic messages**: `feat(auth): add login`, `fix(rate-limit): correct reset time`
- Do not combine unrelated changes
- Stage and commit each group separately

## Key Directories

- `/app` - Next.js App Router routes and API endpoints
- `/src/lib/actions` - Server Actions (primary data layer)
- `/src/lib/error` - Centralized error handling with domain-specific codes
- `/src/lib/supabase` - Supabase clients and optional service classes
- `/src/lib/validators` - Zod validation schemas
- `/src/hooks` - Custom React hooks wrapping React Query
- `/src/config` - App configuration (routes, security, site settings)
- `/src/middleware` - Auth, security headers, rate limiting
- `/supabase/migrations` - Database migrations

## API Routes Pattern

All API routes use these wrappers:

```typescript
import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'

export const GET = withRateLimit(
  'operationName',
  withApiErrorHandler(async (request: NextRequest) => {
    const supabase = await createClient()
    // ... logic
    return NextResponse.json({ success: true })
  })
)
```

### API Routes Inventory

- `/api/auth/confirm` - Email verification (PKCE)
- `/api/auth/reset-password` - Password reset (PKCE)
- `/api/og` - Default Open Graph image generation
- `/api/og/profile` - Profile Open Graph image generation
- `/api/social-metadata` - Social preview metadata fetcher
- `/api/sentry-example-api` - Sentry error testing endpoint

## Documentation

- Architecture: `docs/architecture.md`
- Project Structure: `docs/structure.md`
- Auth Flows: `docs/authentication-flows.md`
- Security: `docs/security.md`
- Rate Limiting: `docs/rate-limiting.md`
