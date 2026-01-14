# AI Development Guidelines for YwyBase

## Package Management

⚠️ **IMPORTANT**: This project uses pnpm as the package manager. Never use npm or yarn for any package management tasks.

### Always use pnpm commands:

- `pnpm install` - Install dependencies
- `pnpm add <package>` - Add a dependency
- `pnpm add -D <package>` - Add a dev dependency
- `pnpm remove <package>` - Remove a dependency
- `pnpm run <script>` - Run a script

## Project Structure

Follow the structure defined in `STRUCTURE.md` at all times. Before making any changes:

1. Always check `STRUCTURE.md` for the canonical structure
2. Follow Next.js 15 App Router conventions
3. Maintain separation of concerns

## Key Rules

1. **Never** create new files in the wrong location
2. **Always** use the App Router (`/app`) for all routes
3. **Never** mix Pages Router (`/pages`) with App Router
4. **Always** validate input with Zod
5. **Always** generate and use TypeScript types and interfaces

## Common Patterns

### API Routes

- Use `route.ts` in the appropriate `/app/api` subdirectory
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

## Code Style & Quality

### TypeScript Requirements

- **Always** include explicit return types for all functions and methods
- Use TypeScript types and interfaces for all function parameters and return values
- Follow the project's ESLint and TypeScript configuration

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

## MUI Guidelines

### Version

- Using **MUI v7.3.4**

### Component Usage

- Use MUI 7 components with Pigment CSS
- Follow MUI theming patterns
- Use `sx` prop for one-off styles
- Create custom theme variants in theme file

## Data Fetching Patterns

### React Query Best Practices

- Always include proper TypeScript types for queries and mutations
- Use optimistic updates with `onMutate` and proper rollback in `onError`
- Configure appropriate `staleTime` and `gcTime` for performance
- Handle errors properly with structured logging
- Use core hooks directly - avoid unnecessary context wrappers
- Pass required parameters (like userId) to hooks rather than relying on context

## Form Handling

### React Hook Form + Zod

- Use React Hook Form for all form handling
- Use Zod for validation schemas
- Auto-saving controls for binary or multiple-select options
- Save button for text or image inputs with proper state management

### Save Button States

Save buttons must follow their state: "Save", "Saving...", "Saved", and must be disabled during state changes or if the form was not changed yet.

## Logging Patterns

### Pino Logger Usage

Always follow this pattern:

```typescript
// Correct:
logger.method({ context }, 'message')

// Incorrect:
logger.method('message', { context }) // Will cause TypeScript errors

// Examples:
logger.info({ userId: 123 }, 'User logged in')
logger.error({ error, userId: 456 }, 'Failed to update profile')
logger.debug({ query, params }, 'Database query executed')
```

Key points:

1. Context object is always the first argument
2. Message string is always the second argument
3. Error objects should be passed in the context with key 'error'

## Error Handling Integration

### Global Error Handler Usage

When integrating with the global error handler (@/lib/error), follow these patterns:

1. **Service Error Handling**:
   - Use `this.handleError()` from BaseService for all service errors
   - Include operation name and relevant context
   - Let the global handler manage error transformation and logging

2. **Error Context**:
   - Always include `operation` name (e.g., 'fetch user profile')
   - Add relevant IDs (userId, etc.) to context
   - The `service` property is automatically added by BaseService

3. **Error Propagation**:
   - Let errors bubble up to the nearest error boundary
   - Don't catch errors just to log them (global handler does this)
   - Use custom error types for specific error cases

4. **Example**:

```typescript
try {
  // ... service code
} catch (error) {
  return this.handleError(error, 'operation name', {
    // Relevant context
    userId: '123',
    // Additional metadata
  })
}
```

## Database Patterns

### Timestamp Management

The database should handle the management of `created_at` and `updated_at` timestamps, not the application code. This ensures:

1. Consistent timestamp generation across all operations
2. Proper timezone handling by the database server
3. Atomic updates to both the record data and its timestamps
4. Prevention of race conditions in timestamp updates

**Do not manually set these fields in application code** when creating or updating records. The database's default values and triggers should manage these timestamps.

## Sentry Integration

### Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry. Use this in try catch blocks or areas where exceptions are expected.

### Tracing Examples

Spans should be created for meaningful actions within applications like button clicks, API calls, and function calls. Use the `Sentry.startSpan` function to create a span. Child spans can exist within a parent span.

#### Custom Span instrumentation in component actions

The `name` and `op` properties should be meaningful for the activities in the call. Attach attributes based on relevant information and metrics from the request.

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

#### Custom span instrumentation in API calls

The `name` and `op` properties should be meaningful for the activities in the call. Attach attributes based on relevant information and metrics from the request.

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
- [ ] Uses pnpm commands
- [ ] Follows logging patterns
- [ ] Handles timestamps correctly

## When In Doubt

1. Check `STRUCTURE.md`
2. Reference Next.js 15 documentation
3. Follow existing patterns in the codebase
4. Ask for clarification if needed
