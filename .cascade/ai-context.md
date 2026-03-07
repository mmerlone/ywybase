# AI Development Guidelines

## Package Management

⚠️ **IMPORTANT**: This project uses pnpm as package manager. Never use npm or yarn for any package management tasks.

### Always use pnpm commands:

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a dependency
- `pnpm add -D <package>` - Add a dev dependency
- `pnpm remove <package>` - Remove a dependency
- `pnpm run <script>` - Run a script

## Project Structure

Follow structure defined in `docs/structure.md` at all times. Before making any changes:

1. Always check `docs/structure.md` for canonical structure
2. Follow Next.js 15 App Router conventions
3. Maintain separation of concerns

## Key Rules

1. **Never** create new files in wrong location
2. **Always** use App Router (`/app`) for all routes
3. **Never** mix Pages Router (`/pages`) with App Router
4. **Always** validate input with Zod
5. **Always** generate and use TypeScript types and interfaces

## Common Patterns

### API Routes

- Use `route.ts` in appropriate `/app/api` subdirectory
- Always validate request/response types
- Use proper HTTP methods and status codes

### Authentication

- Use `@supabase/ssr` for server components
- Protect routes with middleware
- Store auth logic in `/src/lib/auth`

### Error Handling

- Use consistent error responses
- Log errors appropriately
- Never expose sensitive information

## Software Versions

### Core Framework

- **Next.js**: v15.5.x
- **React**: v18.3.x
- **TypeScript**: v5 (implied by @types/react v18)

### UI Libraries

- **MUI (Material-UI)**: v7.3.x
- **@mui/icons-material**: v7.3.x
- **@mui/material-nextjs**: v7.3.x
- **@mui/x-date-pickers**: v8.14.x
- **Emotion**: v11.14.x
- **Tailwind CSS**: v4.1.x

### Data Fetching & State Management

- **@tanstack/react-query**: v5.90.x
- **@tanstack/react-query-devtools**: v5.91.x

### Backend & Database

- **@supabase/ssr**: v0.7.x
- **@supabase/supabase-js**: latest

### Form Handling

- **react-hook-form**: v7.45.x
- **@hookform/resolvers**: v3.3.x
- **zod**: v3.25.x

### Other Key Dependencies

- **pino**: v10.0.x (logging)
- **@sentry/nextjs**: v10 (error tracking)
- **i18next**: v25.6.x (internationalization)

### Common Patterns

- Always include proper TypeScript types for queries and mutations
- Use optimistic updates with `onMutate` and proper rollback in `onError`
- Configure appropriate `staleTime` and `gcTime` for performance
- Handle errors properly with structured logging
- Use core hooks directly - avoid unnecessary context wrappers
- Pass required parameters (like userId) to hooks rather than relying on context

## MUI Guidelines

### Version

- Using **MUI v7.3.x**

## Before You Start Coding

1. Check if similar functionality exists
2. Follow existing patterns
3. Document any deviations

## Code Review Checklist

- [ ] Follows project structure
- [ ] Uses TypeScript types
- [ ] Includes error handling
- [ ] Follows security best practices
- [ ] Includes necessary tests

## When In Doubt

1. Check `docs/structure.md`
2. Reference Next.js 15 documentation
3. Follow existing patterns in codebase
4. Ask for clarification if needed

These examples should be used as guidance when configuring Sentry functionality within a project.

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within applications like button clicks, API calls, and function calls
Use `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

The `name` and `op` properties should be meaningful for activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: 'ui.click',
        name: 'Test Button Click',
      },
      (span) => {
        const value = 'some config'
        const metric = 'some metric'
        // Metrics can be added to the span
        span.setAttribute('config', value)
        span.setAttribute('metric', metric)
        doSomething()
      }
    )
  }
  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  )
}
```

## Custom span instrumentation in API calls

The `name` and `op` properties should be meaningful for activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
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
}
```

# Cascade AI Development Guidelines

## Code Style & Quality

### TypeScript Requirements

- **Always** include explicit return types for all functions and methods
- Use TypeScript types and interfaces for all function parameters and return values
- Follow project's ESLint and TypeScript configuration

### Function Definitions

```typescript
// Bad
function add(a: number, b: number) {
  return a + b
}

// Good
function add(a: number, b: number): number {
  return a + b
}

// Bad
const getUser = (id: string) => {
  return { id, name: 'John' }
}

// Good
interface User {
  id: string
  name: string
}

const getUser = (id: string): User => {
  return { id, name: 'John' }
}
```

---

**Note**: For complete development guidelines and project patterns, see **[AGENTS.md](../AGENTS.md)** as the source of truth.
