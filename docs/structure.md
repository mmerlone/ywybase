# Project Structure

Canonical structure for the Next.js 15.5.6 App Router application. Follow this structure for consistency.

## 🏗️ **Core Principles**

1. **App Router First** - All routes under `/app` using Next.js 15 App Router
2. **React Server Components** - Default to Server Components with `async/await`
3. **Type Safety** - Full TypeScript with generated types from Supabase
4. **Performance** - Built with MUI 7.3.4 and optimized for speed
5. **State Management** - React Query for server state management
6. **Form Handling** - React Hook Form with Zod validation
7. **Authentication** - Supabase Auth with secure sessions
8. **Logging** - Pino structured logging

## 📁 **Directory Structure**

```
/
├── app/                         # Next.js App Router
│   ├── (auth)/                  # Auth routes (grouped)
│   │   └── auth/                # Authentication pages
│   ├── api/                     # API routes
│   │   ├── auth/                # Auth API endpoints
│   │   │   ├── confirm/         # Email confirmation handler
│   │   │   └── reset-password/  # Password reset handler
│   │   └── sentry-example-api/  # Sentry integration example
│   ├── about/                   # About page
│   ├── cookies/                 # Cookie policy
│   ├── copyright/               # Copyright page
│   ├── error/                   # Error display page
│   ├── privacy/                 # Privacy policy
│   ├── profile/                 # Profile management
│   ├── sentry-example-page/     # Sentry error testing page
│   └── terms/                   # Terms of service
│
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── auth/                # Auth components
│   │   ├── cookie/              # Cookie consent components
│   │   ├── error/               # Error boundaries
│   │   ├── example/             # Example components
│   │   ├── forms/               # Form components
│   │   ├── icons/               # Icon components
│   │   ├── layout/              # Layout components
│   │   ├── marketing/           # Marketing components (CTA, features, etc.)
│   │   ├── profile/             # Profile components
│   │   └── providers/           # Context providers
│   │
│   ├── config/                  # App configuration
│   │   ├── query.ts             # React Query configuration
│   │   ├── routes.ts            # Route definitions
│   │   ├── security.ts          # Security configuration
│   │   ├── site.ts              # Site metadata and configuration
│   │   └── supabase.ts          # Supabase configuration
│   │
│   ├── contexts/                # React contexts
│   │   ├── profile/             # Profile context and controller
│   │   └── SnackbarContext.tsx  # Snackbar notifications
│   │
│   ├── hooks/                   # Custom React hooks
│   ├── i18n/                    # Internationalization
│   ├── lib/                     # Core libraries
│   │   ├── actions/             # Server Actions
│   │   │   ├── auth/            # Auth server actions
│   │   │   ├── account.ts       # Account management actions
│   │   │   ├── location.ts      # Location detection actions
│   │   │   └── profile.ts       # Profile actions
│   │   ├── error/               # Error handling
│   │   ├── logger/              # Logging system
│   │   ├── supabase/            # Database integration & services
│   │   ├── utils/               # Utility functions
│   │   └── validators/          # Validation schemas
│   │
│   ├── middleware/              # Application middleware
│   │   ├── security/            # Security middleware (Headers, CSRF, etc.)
│   │   ├── auth.ts              # Auth middleware
│   │   ├── authorization.ts     # Authorization middleware
│   │   ├── index.ts             # Middleware orchestration
│   │   ├── request-logger.ts    # Request logging
│   │   ├── session.ts           # Session management
│   │   └── utils/               # Middleware utilities
│   │
│   ├── themes/                  # MUI theme definitions
│   │   ├── concrete.ts          # Concrete theme
│   │   ├── index.ts             # Theme exports
│   │   ├── mui.ts               # MUI default theme
│   │   └── ywybase.ts           # YwyBase theme
│   │
│   └── types/                   # TypeScript types
│
├── public/                      # Static assets
├── scripts/                     # Build and utility scripts
│   ├── generate-supabase-types.ts # Supabase type generation
│   ├── generate-i18n-types.ts   # i18n type generation
│   ├── generate-themes.ts       # Theme generation
│   ├── init-database.ts         # Database initialization
│   ├── watch-i18n.ts            # i18n file watcher
│   └── README.md                # Scripts documentation
│
└── supabase/                    # Database migrations
    ├── migrations/              # SQL migration files
    └── README.md                # Supabase documentation
```

## 📋 **File Naming Conventions**

- **Components**: `PascalCase` (e.g., `UserProfile.tsx`)
- **Hooks**: `camelCase` with `use` prefix (e.g., `useAuth.ts`)
- **Utilities**: `camelCase` (e.g., `cookieUtils.ts`)
- **Routes**: `kebab-case` (e.g., `user-profile/`)
- **Types**: `camelCase` with type suffix (e.g., `userTypes.ts`)

## 🔗 **Documentation Links**

### **📚 Core Documentation**

- **[Main README](../README.md)** - Project overview and getting started
- **[Contributing Guidelines](../CONTRIBUTING.md)** - How to contribute
- **[Architecture Guide](./architecture.md)** - Clean architecture patterns
- **[Error Handling](../src/lib/error/README.md)** - Error management patterns

### **🏗️ Library Documentation**

- **[Library Architecture](../src/lib/README.md)** - Core libraries overview
- **[Logger System](../src/lib/logger/README.md)** - Structured logging
- **[Supabase Integration](../src/lib/supabase/README.md)** - Database and auth
- **[Utils Library](../src/lib/utils/README.md)** - Utility functions
- **[Validators Library](../src/lib/validators/README.md)** - Zod validation
- **[Hooks Library](../src/hooks/README.md)** - Custom React hooks
- **[Middleware Library](../src/middleware/README.md)** - Application middleware

### **🛠️ Development Tools**

- **[Scripts Directory](../scripts/README.md)** - Type generation and build scripts
- **[Supabase Overview](../supabase/README.md)** - Database schema and migrations

## 🛠️ **Development Guidelines**

### **Adding New Features**

1. **Pages**: Add to `app/` directory following App Router conventions
2. **Components**: Add to appropriate subdirectory in `src/components/`
3. **Hooks**: Add to `src/hooks/` with proper TypeScript types
4. **Utilities**: Add to `src/lib/utils/` or create new library module
5. **Types**: Add to `src/types/` or colocate with feature

### **Component Organization**

```typescript
// Feature-based organization example
src/components/
├── auth/
│   ├── AuthForm.tsx
│   ├── LoginForm.tsx
│   └── SignUpForm.tsx
├── profile/
│   ├── ProfileCard.tsx
│   ├── ProfileForm.tsx
│   └── ProfileAvatar.tsx
└── shared/
    ├── Button.tsx
    ├── Input.tsx
    └── Modal.tsx
```

### **Type Safety Patterns**

```typescript
// Define types in types directory
export interface UserProfile {
  id: string
  email: string
  displayName: string
}

// Use in components
interface UserProfileProps {
  profile: UserProfile
  onUpdate: (profile: Partial<UserProfile>) => void
}

// Export from types index
export * from './userTypes'
export * from './apiTypes'
```

## 📦 **Key Dependencies by Layer**

### **Frontend Layer**

- **Next.js 15.5.6** - Framework
- **React 18.3.1** - UI library
- **Material UI 7.3.4** - Components
- **TypeScript 5.x** - Type safety

### **Data Layer**

- **Supabase** - Database & auth
- **TanStack Query** - Data fetching
- **React Hook Form** - Forms
- **Zod** - Validation

### **Development Layer**

- **ESLint** - Linting
- **Prettier** - Formatting
- **Husky** - Git hooks
- **Pino** - Logging

## 🚀 **Quick Reference**

### **Creating a New Page**

```typescript
// app/new-page/page.tsx
export default function NewPage() {
  return <div>New Page Content</div>
}
```

### **Creating a New Component**

```typescript
// src/components/NewComponent.tsx
interface NewComponentProps {
  title: string
}

export function NewComponent({ title }: NewComponentProps) {
  return <div>{title}</div>
}
```

### **Creating a New Hook**

```typescript
// src/hooks/useNewFeature.ts
export function useNewFeature() {
  const [state, setState] = useState(null)

  const action = useCallback(() => {
    // Your logic
  }, [])

  return { state, action }
}
```

### **Creating a New Utility**

```typescript
// src/lib/utils/newUtility.ts
export function newUtility(input: string): string {
  return input.toUpperCase()
}
```

## 🔧 **Environment Setup**

### **Required Environment Variables**

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

### **Optional Environment Variables**

```bash
LOG_LEVEL=info
NODE_ENV=production
```

## 📱 **File Organization Best Practices**

1. **Colocate related files** - Keep components, styles, and tests together
2. **Use barrel exports** - Create `index.ts` files for cleaner imports
3. **Feature-based structure** - Group by feature, not by file type
4. **Consistent naming** - Follow established naming conventions
5. **Type safety first** - Always include proper TypeScript types

---

**Follow this structure for consistency across the project.**
