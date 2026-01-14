# Error Handling System

A comprehensive, centralized error handling system for the YwyBase application. This system provides structured error classification, consistent logging, and user-friendly error reporting.

## 🎯 **Overview**

The error handling system ensures:

- **Consistent error classification** across all layers
- **Structured logging** with rich context
- **User-friendly error messages**
- **Type-safe error handling**
- **Centralized error management**

## 📁 **Architecture**

```
src/lib/error/
├── README.md                    # This documentation
├── codes.ts                     # Error code definitions and enums
├── errors.ts                    # Custom error classes (AuthError, DatabaseError, etc.)
├── index.ts                     # Main module exports
├── server.ts                    # Server-side specific exports
├── core/                        # Core error utilities (isAppError, etc.)
├── handlers/                    # Implementation of error handlers (base, client, server)
├── middlewares/                 # Middleware for server actions and API routes
└── types.ts                     # TypeScript interfaces and types
```

## 🔧 **Core Components**

### **1. Error Handler (`handlers/`)**

The central dispatcher that routes errors to appropriate handlers:

```typescript
import { createErrorHandler } from '@/lib/error'

// Basic usage
throw handleError(error, { operation: 'updateProfile' })

// With rich context
throw handleError(error, createDatabaseContext(userId, ProfileOperationEnum.UPDATE))
```

### **2. Error Classes (`errors.ts`)**

Structured error types with proper classification:

```typescript
import { AuthError, DatabaseError, ValidationError } from '@/lib/error/errors'

// Authentication errors
throw new AuthError({
  code: ErrorCodes.auth.invalidCredentials(),
  message: 'Invalid email or password',
  context: { operation: 'signIn', email },
  statusCode: 401,
})

// Database errors
throw new DatabaseError({
  code: ErrorCodes.database.notFound(),
  message: 'Profile not found',
  context: { table: 'profiles', userId },
  statusCode: 404,
})
```

### **3. Error Codes (`codes.ts`)**

Centralized error code definitions:

```typescript
import { ErrorCodes } from '@/lib/error/codes'

// Authentication codes
ErrorCodes.auth.invalidCredentials() // "AUTH/INVALID_CREDENTIALS"
ErrorCodes.auth.userNotFound() // "AUTH/USER_NOT_FOUND"
ErrorCodes.auth.sessionExpired() // "AUTH/SESSION_EXPIRED"

// Database codes
ErrorCodes.database.notFound() // "DATABASE/NOT_FOUND"
ErrorCodes.database.connectionError() // "DATABASE/CONNECTION_ERROR"

// Validation codes
ErrorCodes.validation.invalidInput() // "VALIDATION/INVALID_INPUT"
```

## 🚀 **Usage Patterns**

### **Service Layer**

```typescript
export class ProfileService extends BaseService {
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      // ... database operation
      return profile
    } catch (error) {
      // ✅ Use BaseService.handleError()
      return this.handleError(error, 'fetch profile', { userId })
    }
  }
}
```

### **Server Actions**

```typescript
import { withServerActionErrorHandling } from '@/lib/error/server'

export const updateProfile = withServerActionErrorHandling(
  async (data: ProfileUpdateData) => {
    // ... action logic
    return createServerActionSuccess(result, 'Profile updated')
  },
  {
    operation: 'updateProfile',
    revalidatePaths: ['/profile'],
    successMessage: 'Profile updated successfully',
  }
)
```

### **API Routes**

```typescript
import { withApiErrorHandler } from '@/lib/error/server'

export const GET = withApiErrorHandler(async (request: NextRequest) => {
  // ... route logic
  return NextResponse.json(data)
})
```

### **React Components**

```typescript
import { handleError } from '@/lib/error'

const handleSubmit = async (data: FormData) => {
  try {
    await updateProfile(data)
    showSuccess('Profile updated!')
  } catch (error) {
    // ✅ Use centralized error handling
    const appError = handleError(error, {
      operation: 'updateProfile',
      userId: profile?.id,
    })
    setError(appError)
  }
}
```

### **React Hooks**

```typescript
const { data, error } = useQuery({
  queryKey: ['profile', userId],
  queryFn: async () => {
    try {
      return await loadProfile(userId)
    } catch (error) {
      // ✅ Log and propagate
      logger.error({ error, userId }, 'Failed to load profile')
      throw error
    }
  },
  // ✅ Retry configuration based on error type
  retry: (failureCount, error) => {
    if (error instanceof BusinessError && [403, 404].includes(error.statusCode)) {
      return false // Don't retry auth/not found errors
    }
    return failureCount < 3
  },
})
```

## 📋 **Error Context Types**

### **Database Context**

```typescript
import { createDatabaseContext } from '@/lib/error/handler'

throw handleError(error, createDatabaseContext(userId, ProfileOperationEnum.LOAD))
```

### **Validation Context**

```typescript
import { createValidationContext } from '@/lib/error/handler'

throw handleError(error, createValidationContext(fieldName, validationErrors))
```

### **Auth Context**

```typescript
import { createAuthContext } from '@/lib/error/handler'

throw handleError(error, createAuthContext('signIn', { email, provider: 'supabase' }))
```

## 🔍 **Error Classification**

The system automatically classifies errors based on:

1. **Error Type**: AuthError, DatabaseError, ValidationError, etc.
2. **Error Code**: Structured codes like "AUTH/INVALID_CREDENTIALS"
3. **Context**: Operation, user ID, request details, etc.
4. **Severity**: Based on HTTP status codes and error types

## 📊 **Logging Patterns**

### **Structured Logging**

```typescript
// ✅ Correct: Context-first pattern
logger.error({ error, userId, operation }, 'Failed to update profile')

// ❌ Incorrect: Message-first pattern
logger.error('Failed to update profile', { error, userId, operation })
```

### **Error Context Enrichment**

```typescript
logger.error(
  {
    error: appError,
    context: {
      userId: '123',
      operation: 'updateProfile',
      table: 'profiles',
      requestTime: Date.now(),
    },
  },
  'Database operation failed'
)
```

## 🛡️ **Error Boundaries**

### **Global Error Boundary**

```typescript
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary'

// In app root
<GlobalErrorBoundary>
  <App />
</GlobalErrorBoundary>
```

The GlobalErrorBoundary automatically:

- Catches React rendering errors
- Logs structured error information
- Shows user-friendly error UI
- Provides recovery options

## 🎯 **Best Practices**

### **DO ✅**

- ✅ Use `handleError()` for centralized error processing
- ✅ Include rich context in error objects
- ✅ Use appropriate error codes from `ErrorCodes`
- ✅ Follow the context-first logging pattern
- ✅ Propagate errors properly (don't swallow silently)
- ✅ Use structured error types (AuthError, DatabaseError, etc.)

### **DON'T ❌**

- ❌ Throw generic `new Error()` messages
- ❌ Use `console.log/error/warn()` (use logger instead)
- ❌ Swallow errors silently
- ❌ Create manual error codes (use ErrorCodes enum)
- ❌ Handle errors inconsistently across layers

## 🔧 **Integration Examples**

### **Complete Service Example**

```typescript
export class ProfileService extends BaseService {
  async updateProfile(userId: string, data: ProfileUpdate): Promise<Profile> {
    try {
      const { data: profile, error } = await this.client.from('profiles').update(data).eq('id', userId).single()

      if (error) throw error
      if (!profile) {
        throw new DatabaseError({
          code: ErrorCodes.database.notFound(),
          message: 'Profile not found after update',
          context: { table: 'profiles', userId, operation: 'updateProfile' },
          statusCode: 404,
        })
      }

      return convertDbProfile(profile)
    } catch (error) {
      return this.handleError(error, 'update profile', { userId, data })
    }
  }
}
```

### **Complete Component Example**

```typescript
export function ProfileForm({ userId }: { userId: string }) {
  const [error, setError] = useState<AppError | null>(null)
  const { showSuccess, showError } = useSnackbar()

  const handleSubmit = async (formData: ProfileFormData) => {
    try {
      const updatedProfile = await profileService.updateProfile(userId, formData)
      showSuccess('Profile updated successfully!')
      return updatedProfile
    } catch (error) {
      // ✅ Centralized error handling
      const appError = handleError(error, {
        operation: 'updateProfile',
        userId,
        formData,
      })
      setError(appError)
      showError(appError.message)
      throw appError
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Form fields */}
      {error && <ErrorMessage error={error} />}
    </form>
  )
}
```

## 📈 **Monitoring & Debugging**

### **Error Metrics**

The system provides structured data for monitoring:

- Error codes and frequencies
- Operation-specific error rates
- User-affected error patterns
- Performance impact of errors

### **Development Debugging**

In development mode, the GlobalErrorBoundary shows:

- Full error stack traces
- Structured error information
- Error context and metadata
- Component stack information

## 🔄 **Migration Guide**

### **From Manual Error Handling**

```typescript
// BEFORE
try {
  await updateProfile(data)
} catch (error) {
  console.error('Update failed:', error)
  setError('Failed to update profile')
}

// AFTER
try {
  await updateProfile(data)
} catch (error) {
  const appError = handleError(error, {
    operation: 'updateProfile',
    userId: profile?.id,
  })
  setError(appError)
}
```

### **From Generic Errors**

```typescript
// BEFORE
throw new Error('User not found')

// AFTER
throw new DatabaseError({
  code: ErrorCodes.database.notFound(),
  message: 'User profile not found',
  context: { table: 'profiles', userId },
  statusCode: 404,
})
```

## 🎉 **Benefits**

- **Consistency**: Same error handling patterns everywhere
- **Debuggability**: Rich context and structured logging
- **User Experience**: Friendly error messages and recovery options
- **Maintainability**: Centralized error logic
- **Type Safety**: Full TypeScript support
- **Monitoring**: Structured data for error tracking

## 📚 **Additional Resources**

- [Error Types Reference](./types.ts)
- [Error Code Reference](./codes.ts)
- [Server Actions Guide](./server-actions.ts)
- [API Middleware Guide](./api-middleware.ts)

---

**This error handling system represents a production-ready, scalable approach to error management that ensures excellent developer experience and user experience alike.**
