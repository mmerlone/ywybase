# YwyBase Project Patterns & Rules

This file consolidates project patterns and rules. For the complete source of truth, see **[AGENTS.md](../AGENTS.md)**.

## Core Architecture

### Framework & Technology Stack

- **Next.js 15.5.x** with App Router
- **React 18.3.x** with Server Components
- **TypeScript 5.x** in strict mode
- **MUI 7.3.x** with Pigment CSS for UI components
- **Tailwind CSS 4.1.x** for utility-first styling
- **Supabase** for authentication and database
- **React Query 5.90.x** for server state management
- **React Hook Form 7.45.x** with Zod validation
- **Pino 10.0.x** for logging
- **Sentry 10** for error tracking

## Project Structure Rules

### Directory Organization

Follow `docs/structure.md` as canonical reference.

### File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `UserProfile.tsx`)
- **Hooks**: `camelCase.ts` (e.g., `useAuth.ts`)
- **Utilities**: `camelCase.ts` (e.g., `formatDate.ts`)
- **Routes**: `kebab-case` directories (e.g., `user-profile/`)
- **Types**: `PascalCase.ts` (e.g., `UserType.ts`)

### Import Order & Aliases

1. External libraries (React, Next.js, MUI, etc.)
2. Internal modules (using @/\* alias)
3. Relative imports (./, ../)
4. Types-only imports

**Import Alias**: `@/*` maps to `./src/*`

## Component Patterns

### Server vs Client Components

- **Default**: Server Components (no "use client")
- **Client Components**: Only when needed (interactivity, hooks, browser APIs)
- **Explicit "use client"**: Always at the top of the file when required

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
- Avoid `any` and `unknown` unless justified
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
- **Zod** for validation schemas
- **Auto-saving** for binary/multi-select inputs
- **Save button** for text/image inputs with proper state management

## Styling Patterns

### MUI Integration

- Use MUI 7 components with Pigment CSS
- Follow MUI theming patterns
- Use `sx` prop for one-off styles
- Create custom theme variants in theme file

### Tailwind CSS

- Use for utility classes and layout
- Combine with MUI components
- Use `cn()` utility for className concatenation
- Follow Tailwind's naming conventions

### CSS-in-JS

- Prefer MUI's `styled()` API over inline styles
- Use Emotion for complex custom components
- Keep styling co-located with components

## Authentication Patterns

### Server-Side Auth

```typescript
// In Server Components and API routes
import { createClient } from '@/lib/supabase/server'
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY)
```

### Client-Side Auth

```typescript
// In Client Components
import { createClientComponentClient } from '@/lib/supabase/auth/client'
const supabase = createClientComponentClient()
```

### Route Protection

- Use middleware for route-level protection
- Implement RLS (Row Level Security) in database
- Check auth state in Server Components

## Error Handling Patterns

### Global Error Handler

- Use `@/lib/error` for centralized error handling
- Follow BaseService pattern for service errors
- Include operation name and context in error logs

### Client-Side Errors

- Use Error Boundaries for component errors
- Implement proper loading and error states
- Use Sentry.captureException() for error tracking

### Server-Side Errors

- Return structured error responses
- Log errors with context using Pino
- Never expose sensitive information

## Database Patterns

### Supabase Integration

- Generate TypeScript types from database schema
- Use `scripts/generate-supabase-types.ts`
- Let database handle `created_at`/`updated_at` timestamps
- Follow RLS patterns for security

### Type Safety

- Always use generated types for database operations
- Define interfaces for API request/response types
- Use Zod for runtime validation

## Performance Patterns

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

## Development Patterns

### Code Quality

- ESLint + Prettier for consistent formatting
- Husky pre-commit hooks for code quality
- TypeScript strict mode enabled
- Always include explicit return types

### Testing

- Test error scenarios with mocked responses
- Verify error codes and messages
- Test error boundaries in components
- Focus on integration tests over unit tests

### Logging

- Use Pino logger with proper context
- Follow pattern: `logger.method({ context }, "message")`
- Include relevant IDs and metadata in context
- Error objects should be in context with 'error' key

## Security Patterns

### Input Validation

- Always validate with Zod schemas
- Sanitize user inputs
- Use parameterized queries
- Implement proper CSRF protection

### Authentication Security

- Secure cookie settings
- Rate limiting on auth endpoints
- Session validation
- Password hashing with Argon2

### Data Security

- Never expose sensitive data in client
- Use environment variables for secrets
- Implement proper RLS in database
- Secure API endpoints with proper auth

## Internationalization

### i18n Setup

- Use i18next for internationalization
- Store translation files in `/src/locales`
- Use React-i18next for components
- Generate TypeScript types for translations

### Usage Patterns

```typescript
import { useTranslation } from 'react-i18next'
const { t } = useTranslation()
return <h1>{t('welcome.title')}</h1>
```

## Build & Deployment

### Development

### Development

## Git Workflow

### Branch Strategy

- Main branch for production
- Feature branches for new work
- PR reviews required
- Automated tests on push

### Pre-commit Hooks

- ESLint with auto-fix
- Prettier formatting
- Type checking
- Lint-staged for efficiency

## Common Anti-Patterns to Avoid

### ❌ Don't Do This

- Mix Pages Router with App Router
- Use `any` types without justification
- Use `typeof` without justification
- Create files in wrong locations
- Hardcode configuration values
- Ignore TypeScript errors
- Use npm/yarn instead of pnpm
- Manual timestamp management
- Expose sensitive data

### ✅ Do This Instead

- Follow App Router patterns exclusively
- Use proper TypeScript types
- Follow project structure
- Use environment variables
- Fix all TypeScript errors
- Always use pnpm commands
- Let database handle timestamps
- Implement proper security

## Tool Configuration Summary

### ESLint

- Next.js recommended rules
- TypeScript support
- React hooks rules
- Import order enforcement

### Prettier

- Single quotes
- No semicolons
- 2-space indentation
- 120 character line width
- LF line endings

### TypeScript

- Strict mode enabled
- Path aliases configured
- Proper include/exclude patterns
- JSX support enabled

### Next.js

- App Router enabled
- Standalone output
- TypeScript build errors not ignored
- MUI transpilation configured

---

**Note**: For complete patterns and rules, see **[AGENTS.md](../AGENTS.md)** as the source of truth.
