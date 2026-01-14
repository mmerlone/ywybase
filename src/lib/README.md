# Library Architecture

This directory contains the core library modules that power the application. Each module is designed to be extensible and follows established patterns.

## 🏗️ **Directory Structure**

```
src/lib/
├── actions/        # Server Actions (Auth, Profile, Location)
├── auth/           # Auth client-side logic
├── error/          # Centralized error handling
├── logger/         # Logging utilities
├── security/       # Security utilities
├── supabase/       # Database integration & services
├── utils/          # Utility functions
├── validators/     # Data validation schemas
└── utils.ts        # General utilities
```

## 🚀 **Quick Start for Developers**

### Adding a New Library Module

1. **Create the module directory**:

```bash
mkdir src/lib/your-module
```

2. **Create the main file**:

```typescript
// src/lib/your-module/index.ts
export function yourFunction() {
  // Your implementation
}
```

3. **Add documentation**:

```bash
touch src/lib/your-module/README.md
```

4. **Export from main lib** (if needed):

```typescript
// src/lib/index.ts
export * from './your-module'
```

### Using Existing Modules

```typescript
// Import any module
import { buildLogger } from '@/lib/logger/server'
import { getProfile } from '@/lib/actions/profile'
import { loginSchema } from '@/lib/validators/auth'
```

## 📚 **Module Guides**

### **Authentication** (`auth/`)

Handles user authentication with Supabase integration.

**What's here**: Login, registration, password management, session handling

**How to extend**:

- Add new auth methods in `actions.ts`
- Create new auth providers in `service.ts`
- Update types in `@/types/auth.types`

### **Error Handling** (`error/`)

Centralized error management with structured types.

**What's here**: Error classes, handlers, codes, and utilities

**How to extend**:

- Add new error types in `errors/`
- Define error codes in `codes.ts`
- Update the handlers in `handlers/`

### **Logger** (`logger/`)

Structured logging system with performance monitoring.

**What's here**: Pino-based logging with context-first pattern (Server & Client)

**How to extend**:

- Add new logging utilities in `perf.ts`
- Update configuration in `config.ts`
- Follow the context-first pattern: `logger.info({ context }, "message")`

### **Security** (`security/`)

Security utilities for comprehensive application protection.

**What's here**: Security headers, CSRF protection, rate limiting, input sanitization, audit logging

**How to extend**:

- Add new security utilities following existing patterns
- Update configuration in `@/config/security.ts`
- Use proper TypeScript types from `@/types/security.types.ts`
- Follow security best practices and audit requirements

Database integration with service layer architecture.

**What's here**: Client/server separation, session management, services

**How to extend**:

- Create new actions in `actions/`
- Extend the base service class in `supabase/services/`
- Add new client/server utilities

### **Utils** (`utils/`)

Reusable utility functions for common operations.

**What's here**: Cookie management, location services, profile utils, timezone

**How to extend**:

- Add new utility files following the naming pattern
- Include proper TypeScript types
- Add JSDoc documentation

### **Validators** (`validators/`)

Zod-based validation schemas for forms and API data.

**What's here**: Auth, profile, privacy, and common validation schemas

**How to extend**:

- Create new validation schemas in appropriate files
- Use existing common schemas (email, password)
- Export inferred types for TypeScript

## 🛠️ **Development Patterns**

### **File Organization**

- Use `index.ts` for main exports
- Group related functionality in subdirectories
- Follow TypeScript naming conventions

### **Error Handling**

```typescript
// Use the error system
import { BusinessError, ErrorCodes } from '@/lib/error'

throw new BusinessError({
  code: ErrorCodes.validation.invalidInput(),
  message: 'Invalid input provided',
  context: { field: 'email' },
})
```

### **Logging**

```typescript
// Follow the context-first pattern
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('YourModule')
logger.info({ userId: '123' }, 'User action completed')
```

### **Type Safety**

```typescript
// Always export and use inferred types
import { z } from 'zod'

const schema = z.object({
  name: z.string(),
})

export type YourType = z.infer<typeof schema>
```

## 🔧 **Common Tasks**

### **Adding a New Service**

```typescript
// src/lib/actions/your-action.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { withServerActionErrorHandling } from '@/lib/error/server'

export const getData = withServerActionErrorHandling(
  async (id: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('your_table').select('*').eq('id', id).single()

    if (error) throw error
    return data
  },
  { operation: 'getData' }
)
```

### **Adding a New Validator**

```typescript
// src/lib/validators/your-validator.ts
import { z } from 'zod'
import { emailSchema } from './common'

export const yourSchema = z.object({
  email: emailSchema,
  name: z.string().min(1),
})

export type YourType = z.infer<typeof yourSchema>
```

### **Adding a New Utility**

```typescript
// src/lib/utils/your-util.ts
import { buildLogger } from '@/lib/logger/server'

const logger = buildLogger('your-util')

export function yourUtility(input: string): string {
  logger.debug({ input }, 'Processing utility')
  return input.toUpperCase()
}
```

## 📋 **Checklist for New Modules**

- [ ] Create directory with descriptive name
- [ ] Implement main functionality
- [ ] Add TypeScript types
- [ ] Include error handling
- [ ] Add logging where appropriate
- [ ] Write unit tests
- [ ] Create README.md documentation
- [ ] Update main exports if needed

## 🔗 **Helpful Resources**

- **Error Handling**: See `@/lib/error/README.md`
- **Logging**: See `@/lib/logger/README.md`
- **Security**: See `@/middleware/security/README.md`
- **Database**: See `@/lib/supabase/README.md`
- **Validation**: See `@/lib/validators/README.md`
- **Utilities**: See `@/lib/utils/README.md`

---

**This is a starter template. Extend it based on your project needs.**
