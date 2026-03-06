# Validators Library

Type-safe validation schemas built with Zod for forms, API data, and user input.

## 🚀 **Quick Start**

```typescript
// Authentication validation
import { loginSchema, registerSchema } from '@/lib/validators/auth'
import { clientLogger } from '@/lib/logger'

const loginData = { email: 'user@example.com', password: 'password123' }
const result = loginSchema.safeParse(loginData)

if (result.success) {
  clientLogger.info({ data: result.data }, 'Valid login data')
} else {
  clientLogger.warn({ errors: result.error.errors }, 'Validation errors')
}

// Profile validation
import { profileFormSchema } from '@/lib/validators/profile'

const profileData = {
  display_name: 'John Doe',
  email: 'user@example.com',
  phone: '+1 (555) 123-4567',
}
const profileResult = profileFormSchema.safeParse(profileData)

// Privacy settings validation
import { privacySettingsSchema } from '@/lib/validators/privacy'

const privacyData = {
  data_sharing: { third_parties: false, analytics: true, marketing: false },
  communication_preferences: { email: true, push: false, sms: false },
}
const privacyResult = privacySettingsSchema.safeParse(privacyData)
```

## Overview

This validators library provides:

- **Authentication Validation** - Login, registration, and password management schemas
- **Profile Validation** - User profile data validation with complex field types
- **Privacy Validation** - GDPR-compliant data sharing and communication preference validation
- **Cookie Validation** - Client-side cookie consent validation (localStorage only, not stored in database)
- **Common Validation** - Reusable schemas for email, password, and other common fields
- **Type Safety** - Full TypeScript integration with inferred types

## Architecture

```
src/lib/validators/
├── index.ts        # Main exports and re-exports
├── auth.ts          # Authentication form schemas
├── common.ts        # Common validation schemas (email, password)
├── cookie.ts        # Cookie preference validation
├── privacy.ts       # Privacy settings validation
├── profile.ts       # Profile data validation
└── README.md        # This documentation
```

import { profileFormSchema } from '@/lib/validators/profile'

// Profile form validation
const profileData = {
display_name: 'John Doe',
email: 'user@example.com',
phone: '+1 (555) 123-4567',
bio: 'Software developer',
timezone: 'America/New_York',
birth_date: '1990-01-01',
gender: 'male',
}

const result = profileFormSchema.safeParse(profileData)

````

### Privacy Settings Validation

```typescript
import { privacySettingsSchema } from '@/lib/validators/privacy'
import { cookiePreferencesSchema } from '@/lib/validators/cookie'

// Cookie preferences validation (client-side only, not stored in database)
const cookiePrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
  functional: true,
}
const cookieResult = cookiePreferencesSchema.safeParse(cookiePrefs)

// Privacy settings validation (stored in database)
const privacySettings = {
  data_sharing: {
    third_parties: false,
    analytics: true,
    marketing: false,
  },
  communication_preferences: {
    email: true,
    push: false,
    sms: false,
  },
}
const privacyResult = privacySettingsSchema.safeParse(privacySettings)
````

## API Reference

### Authentication Validators (`auth.ts`)

#### loginSchema

Validates login form data with email and password.

```typescript
export const loginSchema = z.object({
  email: emailSchema, // Validated email
  password: z.string().min(1, 'Password is required'),
})
```

**Type**: `z.infer<typeof loginSchema>` = `{ email: string, password: string }`

#### registerSchema

Validates user registration with comprehensive validation.

```typescript
export const registerSchema = z
  .object({
    name: z.string().min(2).max(100).trim(),
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1),
    acceptTerms: z.literal(true), // Must accept terms
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
```

**Type**: `z.infer<typeof registerSchema>` includes all registration fields

#### forgotPasswordEmailSchema

Validates email for password reset requests.

```typescript
export const forgotPasswordEmailSchema = z.object({
  email: emailSchema,
})
```

#### forgotPasswordPassSchema

Validates new password and confirmation for password reset.

```typescript
export const forgotPasswordPassSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
```

#### updatePasswordSchema

Validates password update with current password verification.

```typescript
export const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
```

### Common Validators (`common.ts`)

#### emailSchema

Reusable email validation with format and length constraints.

```typescript
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .min(5, 'Email must be at least 5 characters')
  .max(255, 'Email cannot be longer than 255 characters')
  .toLowerCase()
  .trim()
```

**Features**:

- Email format validation
- Length constraints (5-255 characters)
- Automatic lowercase conversion
- Whitespace trimming

#### passwordSchema

Configurable password validation based on site requirements.

```typescript
export const passwordSchema = z
  .string()
  .min(minLength, `Password must be at least ${minLength} characters`)
  .max(100, 'Password cannot be longer than 100 characters')
  .refine((value) => !requireUppercase || /[A-Z]/.test(value), {
    message: 'Password must contain at least one uppercase letter',
  })
  .refine((value) => !requireLowercase || /[a-z]/.test(value), {
    message: 'Password must contain at least one lowercase letter',
  })
  .refine((value) => !requireNumber || /\d/.test(value), {
    message: 'Password must contain at least one number',
  })
  .refine((value) => !requireSpecialChar || /[!@#$%^&*(),.?":{}|<>]/.test(value), {
    message: `Password must contain at least one special character (${specialChars})`,
  })
```

**Configuration**: Based on `SITE_CONFIG.passwordRequirements`

### Profile Validators (`profile.ts`)

#### profileFormSchema

Comprehensive profile validation for user data.

```typescript
export const profileFormSchema = z.object({
  id: z.string().uuid().optional(),
  email: z.string().email('Invalid email address'),
  display_name: z.string().min(1).max(100),

  // Optional fields
  first_name: nullableString(100),
  last_name: nullableString(100),
  phone: z.string().regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/),
  bio: z.string().max(500).optional(),
  company: nullableString(100),
  job_title: nullableString(100),
  website: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  country_code: z.string().length(2).optional(),
  state: nullableString(100),
  city: nullableString(100),
  locale: z.string().length(2).optional(),
  avatar_url: z.string().url().optional().nullable(),
  birth_date: z
    .string()
    .refine((date) => moment(date).isValid(), {
      message: 'Invalid date format',
    })
    .optional(),
  gender: z.nativeEnum(GenderPreferenceEnum).optional(),
})
```

**Features**:

- UUID validation for ID
- Email format validation
- Phone number regex validation
- URL validation for website and avatar
- Date validation with moment-timezone
- Enum validation for gender
- Nullable string helper for optional fields

### Privacy Validators (`privacy.ts`)

#### cookiePreferencesSchema

Validates GDPR cookie preference settings.

Note: Cookie preferences are client-side only (localStorage) and not stored in the database.

```typescript
export const cookiePreferencesSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  functional: z.boolean(),
})
```

#### privacySettingsSchema

Comprehensive privacy settings validation for database storage.

Note: Cookie preferences are validated separately and stored in localStorage only.

```typescript
export const privacySettingsSchema = z.object({
  data_sharing: dataSharingSchema.optional(),
  communication_preferences: communicationPreferencesSchema.optional(),
})
```

**Sub-schemas**:

- `dataSharingSchema`: Third-party, analytics, marketing preferences
- `communicationPreferencesSchema`: Email, push, SMS preferences

### Cookie Validators (`cookie.ts`)

#### cookiePreferencesSchema

Standalone cookie preference validation (re-exported from privacy.ts).

```typescript
export const cookiePreferencesSchema = z.object({
  necessary: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
  functional: z.boolean(),
})
```

## Integration Examples

### React Hook Form Integration

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema } from '@/lib/validators/auth'
import { clientLogger } from '@/lib/logger'

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    // Submit login data
    clientLogger.info({ email: data.email }, 'Login form submitted')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input {...register('email')} placeholder="Email" />
        {errors.email && <span>{errors.email.message}</span>}
      </div>

      <div>
        <input {...register('password')} type="password" placeholder="Password" />
        {errors.password && <span>{errors.password.message}</span>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}
```

### Server Action Validation

```typescript
import { registerSchema } from '@/lib/validators/auth'

export async function registerUser(formData: FormData) {
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirmPassword: formData.get('confirmPassword'),
    acceptTerms: formData.get('acceptTerms') === 'true',
  }

  const result = registerSchema.safeParse(data)

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    }
  }

  // Process valid registration data
  const user = await createUser(result.data)
  return { success: true, user }
}
```

### API Route Validation

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { profileFormSchema } from '@/lib/validators/profile'

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    const result = profileFormSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json({ errors: result.error.flatten().fieldErrors }, { status: 400 })
    }

    // Update profile with validated data
    const updatedProfile = await updateProfile(result.data)

    return NextResponse.json({ profile: updatedProfile })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Custom Validation with Refinement

```typescript
import { z } from 'zod'
import { emailSchema } from '@/lib/validators/common'

// Custom validation for business email
const businessEmailSchema = emailSchema.refine(
  (email) => !email.includes('@gmail.com') && !email.includes('@yahoo.com'),
  {
    message: 'Please use a business email address',
    path: ['email'],
  }
)

// Validation with async refinement
const uniqueEmailSchema = emailSchema.refine(
  async (email) => {
    const existingUser = await getUserByEmail(email)
    return !existingUser
  },
  {
    message: 'Email already exists',
    path: ['email'],
  }
)
```

## Best Practices

### 1. Schema Composition

```typescript
// ✅ Good - Reuse common schemas
import { emailSchema, passwordSchema } from '@/lib/validators/common'

const userSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

// ❌ Avoid - Duplicating validation logic
const userSchema = z.object({
  email: z.string().email().min(5).max(255).toLowerCase().trim(),
  password: z.string().min(8).max(100) /* ... */,
})
```

### 2. Error Handling

```typescript
// ✅ Good - Handle validation errors gracefully
const result = schema.safeParse(data)
if (!result.success) {
  const fieldErrors = result.error.flatten().fieldErrors
  return { success: false, errors: fieldErrors }
}

// ✅ Good - Provide user-friendly error messages
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters')

// ❌ Avoid - Generic error messages
const passwordSchema = z.string().min(8, 'Invalid')
```

### 3. Type Inference

```typescript
// ✅ Good - Use inferred types
type LoginFormData = z.infer<typeof loginSchema>

// ✅ Good - Export inferred types for reuse
export type ProfileFormData = z.infer<typeof profileFormSchema>

// ❌ Avoid - Manual type definitions
type LoginFormData = {
  email: string
  password: string
}
```

### 4. Conditional Validation

```typescript
// ✅ Good - Use superRefine for complex validation
const userSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: "Passwords don't match",
      })
    }
  })

  // ✅ Good - Use refine for simple validation
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })
```

## Advanced Usage

### Custom Error Messages

```typescript
import { z } from 'zod'

const customErrorMap: z.ZodErrorMap = (error, ctx) => {
  if (error.code === z.ZodIssueCode.invalid_string) {
    return { message: 'Please enter a valid value' }
  }
  return { message: ctx.defaultError }
}

// Apply custom error map
z.setErrorMap(customErrorMap)
```

### Schema Transformation

```typescript
// Transform data during validation
const userSchema = z.object({
  email: z
    .string()
    .email()
    .transform((val) => val.toLowerCase()),
  name: z.string().transform((val) => val.trim()),
  age: z.string().transform((val) => parseInt(val, 10)),
})

const result = userSchema.parse({
  email: 'USER@EXAMPLE.COM',
  name: '  John Doe  ',
  age: '25',
})
// Result: { email: 'user@example.com', name: 'John Doe', age: 25 }
```

### Default Values

```typescript
const profileSchema = z.object({
  displayName: z.string().default('Anonymous'),
  theme: z.enum(['light', 'dark']).default('light'),
  notifications: z.boolean().default(true),
})

const result = profileSchema.parse({})
// Result: { displayName: 'Anonymous', theme: 'light', notifications: true }
```

### Optional vs Nullable

```typescript
// Optional - field can be omitted entirely
const optionalSchema = z.object({
  name: z.string().optional(),
})

// Nullable - field can be null but must be present
const nullableSchema = z.object({
  name: z.string().nullable(),
})

// Optional and nullable
const optionalNullableSchema = z.object({
  name: z.string().optional().nullable(),
})
```

## Performance Considerations

### 1. Schema Reuse

```typescript
// ✅ Good - Define schemas once
const emailSchema = z.string().email()

// ❌ Avoid - Creating schemas in loops
function validateEmails(emails: string[]) {
  return emails.map((email) => z.string().email().parse(email))
}
```

### 2. Lazy Validation

```typescript
// ✅ Good - Use safeParse for performance-critical code
const result = schema.safeParse(data)
if (!result.success) {
  // Handle error
}

// ❌ Avoid - parse() throws exceptions (slower)
try {
  const result = schema.parse(data)
} catch (error) {
  // Handle error
}
```

### 3. Selective Validation

```typescript
// ✅ Good - Pick only needed fields
const partialSchema = profileSchema.pick(['email', 'displayName'])

// ✅ Good - Omit sensitive fields
const publicSchema = profileSchema.omit(['phone', 'birth_date'])

// ✅ Good - Partial validation
const partialSchema = profileSchema.partial()
```

## Testing

### Unit Testing Schemas

```typescript
import { describe, it, expect } from 'vitest'
import { loginSchema } from '@/lib/validators/auth'

describe('loginSchema', () => {
  it('should validate correct login data', () => {
    const validData = {
      email: 'user@example.com',
      password: 'password123',
    }

    const result = loginSchema.safeParse(validData)
    expect(result.success).toBe(true)
  })

  it('should reject invalid email', () => {
    const invalidData = {
      email: 'invalid-email',
      password: 'password123',
    }

    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    expect(result.error.errors[0].path).toContain('email')
  })

  it('should reject missing password', () => {
    const invalidData = {
      email: 'user@example.com',
      password: '',
    }

    const result = loginSchema.safeParse(invalidData)
    expect(result.success).toBe(false)
    expect(result.error.errors[0].path).toContain('password')
  })
})
```

### Integration Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react'
import { LoginForm } from './LoginForm'

describe('LoginForm Integration', () => {
  it('should show validation errors for invalid data', async () => {
    render(<LoginForm />)

    const submitButton = screen.getByRole('button', { name: 'Login' })
    fireEvent.click(submitButton)

    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })
})
```

## Migration Guide

### From Manual Validation

```typescript
// Before
function validateLogin(data: any) {
  const errors = []

  if (!data.email) {
    errors.push('Email is required')
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format')
  }

  if (!data.password) {
    errors.push('Password is required')
  }

  return { isValid: errors.length === 0, errors }
}

// After
import { loginSchema } from '@/lib/validators/auth'

function validateLogin(data: any) {
  const result = loginSchema.safeParse(data)
  return {
    isValid: result.success,
    errors: result.success ? [] : result.error.flatten().fieldErrors,
  }
}
```

### From Other Validation Libraries

```typescript
// Before (Yup)
import * as yup from 'yup'

const loginSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().required(),
})

// After (Zod)
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})
```

## Contributing

When adding new validators:

1. **Use Zod** for all validation schemas
2. **Provide clear error messages** for users
3. **Export inferred types** for TypeScript usage
4. **Add comprehensive tests** for validation logic
5. **Document complex validation** with comments
6. **Reuse common schemas** when possible

### Adding a New Validator

```typescript
// validators/new-feature.ts
import { z } from 'zod'
import { emailSchema } from './common'

/**
 * Schema for new feature validation
 */
export const newFeatureSchema = z.object({
  email: emailSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['tech', 'business', 'other']),
})

// Export inferred type
export type NewFeatureData = z.infer<typeof newFeatureSchema>
```

---

**Last Updated**: 2025-11-30  
**Version**: 1.0.0  
**Dependencies**: zod, moment-timezone
