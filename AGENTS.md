# AGENTS.md

This file is the **source of truth** for all project rules, patterns, and development guidelines for YwyBase. It consolidates information from `.windsurf/rules/`, `.cascade/ai-context.md`, and other project configuration files.

## 📋 Table of Contents

- [Commands](#commands) - Essential development commands
- [Architecture](#architecture) - Core patterns and data flow
- [Development Standards](#development-standards) - Code quality and patterns
- [Package Management](#package-management) - pnpm-only policy
- [Project Structure](#project-structure) - Directory organization
- [Component Patterns](#component-patterns) - Server/Client component rules
- [Data Patterns](#data-patterns) - Fetching, state management, and forms
- [Styling Patterns](#styling-patterns) - MUI, Tailwind, and CSS guidelines
- [Authentication](#authentication) - Supabase integration and security
- [Error Handling](#error-handling) - Centralized error management
- [Database Patterns](#database-patterns) - Supabase and type safety
- [Performance](#performance) - Optimization strategies
- [Logging](#logging) - Pino structured logging
- [Security](#security) - Input validation and protection
- [Git Workflow](#git-workflow) - Branching and commit standards
- [Testing](#testing) - Test strategies and patterns
- [Build & Deployment](#build--deployment) - Production workflows
- [Environment Variables](#environment-variables) - Configuration requirements
- [Code Review](#code-review) - Quality checklist
- [Troubleshooting](#troubleshooting) - Common issues and solutions

## Commands

### Development

```bash
pnpm dev                    # Start dev server with pino-pretty logging
pnpm build                  # Production build
pnpm start                  # Start production server
```

### Code Quality (run after every task)

```bash
pnpm lint                   # Run ESLint
pnpm lint:fix               # Auto-fix ESLint issues
pnpm type-check             # TypeScript validation
pnpm format                 # Format with Prettier
```

### Database

```bash
pnpm gen:types              # Generate TypeScript types from Supabase schema
pnpm db:init                # Apply migrations to remote database
pnpm db:init --status       # Check migration status
pnpm backup:db              # Generate Supabase schema backups
```

### Other

```bash
pnpm test                   # Run test suite
pnpm gen:themes             # Regenerate theme index after adding/removing themes
pnpm format:check           # Check formatting without changes
```

**⚠️ CRITICAL**: Always use `pnpm`. Never use npm or yarn for any package management tasks.

## Architecture

### Data Flow

`Components → Hooks → Server Actions → Database`

### Core Principles

1. **Clean Architecture**: Layered with explicit dependencies
2. **Server Components Default**: Only add `"use client"` when necessary
3. **Type Safety**: Full TypeScript with strict mode
4. **Performance**: Optimized with MUI 7 and proper caching

### Technology Stack

- **Next.js**: 15.5.6 with App Router
- **React**: 18.3.1 with Server Components
- **TypeScript**: 5.x strict mode
- **MUI**: 7.3.4 with Pigment CSS
- **Tailwind CSS**: 4.1.14 for utilities
- **Supabase**: Authentication and PostgreSQL database
- **React Query**: 5.90.11 for state management
- **React Hook Form**: 7.45.4 with Zod validation
- **Pino**: 10.0.0 for structured logging
- **Sentry**: 10 for error tracking

## Development Standards

### Package Management

- **pnpm ONLY** - Never use npm or yarn
- All scripts use `pnpm run` or direct `pnpm` commands

### Project Structure

Follow `docs/structure.md` as canonical reference:

```
/app                    # Next.js App Router (all routes)
/src                   # Source code
  /components         # Reusable UI components
  /contexts           # React contexts
  /hooks              # Custom React hooks
  /lib                # Utilities and services
    /actions           # Server Actions (primary data layer)
    /error             # Centralized error handling
    /supabase          # Supabase clients and services
    /validators         # Zod validation schemas
    /types              # TypeScript definitions
  /config             # Configuration files
  /middleware         # Next.js middleware
/scripts              # Build and utility scripts
/public               # Static assets
/supabase             # Database migrations and config
/docs                 # Project documentation
```

### File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Hooks**: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Routes**: `kebab-case` directories (e.g., `user-profile/`)
- **Types**: `PascalCase.ts` (e.g., `UserType.ts`)

### Import Order

1. External libraries (React, Next.js, MUI, etc.)
2. Internal modules (`@/*` alias maps to `./src/*`)
3. Relative imports (`./`, `../`)
4. Types-only imports

### TypeScript Requirements

- **Explicit return types required** on all functions (ESLint enforced)
- Avoid type casts unless necessary and on data conversion functions
- Cast `as any` or `as unknown as` is **forbidden** by ESLint rules
- Use generated types from `src/types/supabase.ts` for database operations
- Validate all inputs with Zod schemas

## Component Patterns

### Server vs Client Components

- **Default**: Server Components (no `"use client"`)
- **Client Components**: Only when needed (interactivity, hooks, browser APIs)
- **Explicit `"use client"`**: Always at the top of the file when required

### Component Structure

```typescript
// 1. Imports (external, internal, relative)
// 2. Type definitions (if needed)
// 3. Component function
// 4. Helper functions (inside component when possible)
// 5. JSX return
```

### Props & Types

- Always define explicit interfaces for component props
- Use TypeScript union types for string literals from enums
- Include proper return types for all functions

## Data Patterns

### Server Components Data Fetching

```typescript
// Use async/await in Server Components
async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId) // Direct database calls
  return <div>{user.name}</div>
}
```

### Client Components State Management

```typescript
// Use React Query for server state
const { data, error, isLoading } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => getUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

### Forms

- **React Hook Form** for all form handling
- **Zod** for validation schemas from `src/lib/validators/`
- **Auto-saving** for binary/multi-select inputs
- **Save button** for text/image inputs with proper state management

### React Query Best Practices

- Always include proper TypeScript types for queries and mutations
- Use optimistic updates with `onMutate` and proper rollback in `onError`
- Configure appropriate `staleTime` and `gcTime` for performance
- Handle errors properly with structured logging
- Use core hooks directly - avoid unnecessary context wrappers
- Pass required parameters (like userId) to hooks rather than relying on context

## Styling Patterns

### MUI Integration

- Use MUI 7 components with Pigment CSS
- Follow MUI theming patterns
- Use `sx` prop for one-off styles
- Create custom theme variants in theme file

### Tailwind CSS

- Use for utility classes and layout
- Combine with MUI components
- Use `cn()` utility from `src/lib/utils.ts` for className concatenation
- Follow Tailwind's naming conventions

### CSS-in-JS

- Prefer MUI's `styled()` API over inline styles
- Use Emotion for complex custom components
- Keep styling co-located with components

## Authentication

### Supabase Client Usage

Each context has its own factory - never mix them:

```typescript
// Server Components/Actions
import { createClient } from '@/lib/supabase/server'
const supabase = await createClient()

// Client Components
import { createClientComponentClient } from '@/lib/supabase/client'
const supabase = createClientComponentClient()

// Middleware
import { createClient } from '@/lib/supabase/middleware'
const supabase = createClient()
```

### Route Protection

- Use middleware for route-level protection (`src/middleware/auth.ts`)
- Implement RLS (Row Level Security) in database
- Check auth state in Server Components
- Rate limiting handled by `src/middleware/security/rate-limit.ts`

## Error Handling

### Global Error Handler

Use centralized error system in `src/lib/error/`:

- **Server Actions**: `withServerActionErrorHandling(async () => {...}, { operation: 'name' })`
- **API Routes**: `withApiErrorHandler` wrapper
- **Client**: `handleClientError(error, { operation: 'name' })`

### Error Context Pattern

Always include:

- `operation` name (e.g., 'fetch user profile')
- Relevant IDs (userId, etc.) to context
- The `service` property is automatically added by BaseService

### Example Implementation

```typescript
try {
  // ... service code
} catch (error) {
  return this.handleError(error, 'operation name', {
    userId: '123',
    // Additional metadata
  })
}
```

## Database Patterns

### Supabase Integration

- Generate TypeScript types from database schema with `pnpm run gen:types`
- Let database handle `created_at`/`updated_at` timestamps
- Follow RLS patterns for security
- Use generated types for all database operations

### Type Safety

- Always use generated types from `src/types/supabase.ts`
- Define interfaces for API request/response types
- Use Zod for runtime validation

### Timestamp Management

**CRITICAL**: The database should handle timestamp management, not application code. Do not manually set `created_at` or `updated_at` fields when creating or updating records.

## Performance

### Code Splitting

- Use `next/dynamic` for heavy client components
- Implement proper loading states with Suspense
- Lazy load routes when appropriate

### React Optimization

- Use `React.memo` for expensive components
- Use `useCallback` and `useMemo` appropriately
- Avoid unnecessary re-renders

### Data Optimization

- Configure appropriate `staleTime` and `gcTime` in React Query
- Use optimistic updates with proper rollback
- Implement proper caching strategies

## Logging

### Pino Logger Usage

Always follow this pattern:

```typescript
// CORRECT - context object first, then message
logger.info({ userId, op: 'updateProfile' }, 'Profile updated')
logger.error({ error, userId }, 'Operation failed')

// INCORRECT - causes TypeScript errors
logger.info('Profile updated', { userId })
```

### Key Points

1. Context object is always the first argument
2. Message string is always the second argument
3. Error objects should be passed in the context with key 'error'
4. Include relevant IDs and metadata in context

## Security

### Input Validation

- Always validate with Zod schemas from `src/lib/validators/`
- Sanitize user inputs
- Use parameterized queries
- Implement proper CSRF protection

### Authentication Security

- Secure cookie settings
- Rate limiting on auth endpoints
- Session validation
- Environment variables for secrets only

### Data Security

- Never expose sensitive data in client
- Use environment variables for secrets
- Implement proper RLS in database
- Secure API endpoints with proper auth

## Git Workflow

### Branch Strategy

- **Main branch** for production
- **Feature branches** for new work
- **PR reviews required** before merge
- **Automated tests** on push

### Pre-commit Hooks

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Lint-staged for efficiency

### Commit Guidelines

- **Group by feature/domain** - each commit addresses a single logical change
- **Lowercase semantic messages**: `feat(auth): add login`, `fix(rate-limit): correct reset time`
- Do not combine unrelated changes
- Stage and commit each group separately

## Testing

### Test Structure

- Always use `__tests__` folder
- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

### Focus Areas

- Test error scenarios with mocked responses
- Verify error codes and messages
- Test error boundaries in components
- Focus on integration tests over unit tests

## Build & Deployment

### Development

```bash
pnpm dev    # Port 3000, hot reload, pino-pretty logging
```

### Production

```bash
pnpm build    # Standalone output, optimized bundles
pnpm start    # Production server
```

### Environment-Specific

- Environment-specific configurations
- Proper secret management via environment variables

## Environment Variables

### Required Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_supabase_project_id
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Security Configuration (Required in production)
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Development
NODE_ENV=development
LOG_LEVEL=info
```

### Optional Services

```bash
# Sentry (error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# IP Geolocation
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key

# Upstash Redis/KV (production rate limiting)
KV_REST_API_READ_ONLY_TOKEN=your_upstash_read_only_token
KV_REST_API_TOKEN=your_upstash_api_token
KV_REST_API_URL=https://your-upstash-instance.upstash.io
```

**⚠️ IMPORTANT**: `SUPABASE_SERVICE_ROLE_KEY` is deprecated and not used. Use `SUPABASE_SECRET_KEY` instead.

## Code Review

### Checklist

All code should meet these criteria:

- [ ] Follows project structure from `docs/structure.md`
- [ ] Uses TypeScript with explicit return types
- [ ] Includes proper error handling with centralized system
- [ ] Follows security best practices
- [ ] Includes necessary tests
- [ ] Uses pnpm commands only
- [ ] Follows logging patterns with Pino
- [ ] Handles timestamps correctly (database-managed)
- [ ] Uses proper authentication patterns
- [ ] Follows MUI and Tailwind guidelines

### When In Doubt

1. Check `docs/structure.md` for canonical structure
2. Reference Next.js 15 documentation
3. Follow existing patterns in the codebase
4. Ask for clarification if needed

## Key Directories

### Core Directories

- `/app` - Next.js App Router routes and API endpoints
- `/src/lib/actions` - Server Actions (primary data layer)
- `/src/lib/error` - Centralized error handling with domain-specific codes
- `/src/lib/supabase` - Supabase clients and optional service classes
- `/src/lib/validators` - Zod validation schemas
- `/src/hooks` - Custom React hooks wrapping React Query
- `/src/config` - App configuration (routes, security, site settings)
- `/src/middleware` - Auth, security headers, rate limiting
- `/supabase/migrations` - Database migrations

### API Routes Inventory

All API routes use these patterns:

- `/api/auth/confirm` - Email verification (PKCE)
- `/api/auth/reset-password` - Password reset (PKCE)
- `/api/og` - Default Open Graph image generation
- `/api/og/profile` - Profile Open Graph image generation
- `/api/social-metadata` - Social preview metadata fetcher
- `/api/sentry-example-api` - Sentry error testing endpoint

### Documentation Structure

- Architecture: `docs/architecture.md`
- Project Structure: `docs/structure.md`
- Auth Flows: `docs/authentication-flows.md`
- Security: `docs/security.md`
- Rate Limiting: `docs/rate-limiting.md`
- API Reference: `docs/user-guides/api-reference.md`
- Server Actions: `docs/user-guides/server-actions.md`

## Sentry Integration

### Exception Catching

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture exceptions
Sentry.captureException(error)

// Capture messages
Sentry.captureMessage(message, level)
```

### Tracing

```typescript
// Component actions
Sentry.startSpan(
  {
    op: 'ui.click',
    name: 'Test Button Click',
  },
  (span) => {
    span.setAttribute('config', value)
    span.setAttribute('metric', metric)
    doSomething()
  }
)

// API calls
Sentry.startSpan(
  {
    op: 'http.client',
    name: `GET /api/users/${userId}`,
  },
  async () => {
    const response = await fetch(`/api/users/${userId}`)
    const data = await response.json()
    return data
  }
)
```

## Troubleshooting

### Common Issues and Solutions

#### TypeScript Errors

```bash
# Run type checking
pnpm run type-check

# Fix all errors before committing
```

#### Linting Issues

```bash
# Auto-fix ESLint issues
pnpm run lint:fix

# Manually fix remaining issues
```

#### Build Failures

```bash
# Check environment variables
grep -E "SUPABASE|SENTRY" .env.local

# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### Database Issues

```bash
# Regenerate types after schema changes
pnpm run gen:types

# Check migration status
pnpm run db:init --status

# Reset database (DESTRUCTIVE!)
pnpm run db:init --reset
```

## Post-Task Process

After completing any coding task:

1. **Run lint**: `pnpm lint` - fix all issues
2. **Run type-check**: `pnpm type-check` - fix all errors
3. **Run build** (if config changed): `pnpm build`

## Critical Rules Summary

### ❌ Never Do This

- Mix Pages Router with App Router
- Use `any` or `unkown` types without justification
- Create files in wrong locations
- Hardcode configuration values
- Ignore TypeScript errors
- Use npm/yarn instead of pnpm
- Manual timestamp management
- Expose sensitive data
- Use deprecated `SUPABASE_SERVICE_ROLE_KEY`
- Relax or disable eslint rules, unless justified.

### ✅ Always Do This

- Follow App Router patterns exclusively
- Use proper TypeScript types from the project or installed modules
- Follow project structure from `docs/structure.md`
- Use environment variables for secrets
- Fix all TypeScript errors
- Always use pnpm commands
- Let database handle timestamps
- Implement proper security
- Use centralized error handling

---

**Last Updated**: March 6, 2026  
**Version**: 3.0.0  
**Status**: Source of Truth for YwyBase Development

This file consolidates all project rules and should be kept in sync with the actual project structure and patterns. Update this file when making changes to project conventions, not to individual rule files.
