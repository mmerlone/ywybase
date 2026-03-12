# YwyBase

[![Next.js](https://img.shields.io/badge/Next.js-15.5.x-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.x-61DAFB?style=flat&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![MUI](https://img.shields.io/badge/MUI-7.3.x-007FFF?style=flat&logo=mui)](https://mui.com/)
[![Supabase](https://img.shields.io/badge/@supabase/ssr-0.7.x-3ECF8E?style=flat&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌐 Live Demo

**Experience YwyBase instantly:** Explore the running project at [https://ywybase.vercel.app/](https://ywybase.vercel.app/)

YwyBase - A Solid Ground to Scale. A production-ready Next.js 15 application template with **clean architecture**, authentication, Material UI, and TypeScript. Built for developers who want to ship fast with best practices.

This is a solo project born from experimenting with a myriad of AI-assisted coding tools, primarily using the free tiers of Copilot, Cursor, WindSurf, CodeRabbit, and others. As a solo endeavor spanning engineering, QA, and DevOps, developed in my free time with AI collaboration, bugs are inevitable.

While I originally created this project for my own use, fun, amusement, study and exercise, I decided to share it with the community. Use at your own risk, and if you do, contributions are more than welcome!

## 📑 **Table of Contents**

- [Key Features](#-key-features)
- [Quick Start](#-quick-start)
- [Documentation](#-documentation)
- [Using YwyBase as a Starting Point](#-using-ywybase-as-a-starting-point)
- [Core Dependencies](#core-dependencies)
- [Deployment](#-deployment)
- [Available Scripts](#-available-scripts)
- [Security Features](#️-security-features)
- [Components](#-components)
- [Responsive Design](#-responsive-design)
- [Accessibility](#-accessibility)
- [Contributing](#-contributing)
- [License](#-license)
- [Acknowledgments](#-acknowledgments)

## 🎯 **Key Features**

### **🏗️ Clean Architecture**

- **Layered Architecture** - Components → Hooks → Server Actions → Database
- **Explicit Dependencies** - No magic, clear client injection
- **KISS Principle** - Clean, maintainable code
- **Service Layer** - Clean database operations with error handling

### **🔐 Authentication**

- Email/password auth with Supabase
- Email verification and password recovery
- Protected routes and middleware
- Session management

### **🎨 UI/UX**

- **Multi-theme Support** - Switch between `concrete` and `ywybase` themes, or add your own
- **Material UI v7** - Modern component library with theming
- **Light/Dark Mode** - Built-in support respecting system preferences or manual toggle
- **Responsive Design** - Mobile-first approach
- **WCAG 2.1 Accessibility** - Inclusive design principles

### **⚡ Performance**

- Next.js 15 App Router
- React Server Components
- Code splitting and lazy loading
- Optimized builds

### **🔧 Developer Experience**

- Full TypeScript support
- ESLint + Prettier + Husky
- Pre-configured CI/CD
- Sentry error tracking

## 🚀 **Quick Start**

### **Prerequisites**

- Node.js 18+
- pnpm 8+
- Supabase account

### **🏗️ Architecture Pattern**

```
Components → Hooks → Server Actions → Database
```

**Key Principles:**

- **Explicit Injection**: Services require explicit Supabase client
- **Direct Instantiation**: No factories or magic patterns
- **Clear Boundaries**: Server vs client code separation
- **React Query Hooks**: Use custom hooks for client state management when needed

## 📚 **Documentation**

### **🚀 Getting Started**

- **[Setup Guide](./docs/getting-started/setup.md)** - Complete setup and configuration
- **[Architecture Guide](./docs/architecture.md)** - Clean architecture patterns
- **[Project Structure](./docs/structure.md)** - Directory layout and conventions

### **👤 User Guides**

- **[Server Actions Reference](./docs/user-guides/server-actions.md)** - Server-side operations
- **[API Endpoints Reference](./docs/user-guides/api-reference.md)** - HTTP API documentation
- **[Authentication Flows](./docs/authentication-flows.md)** - Email auth and verification flows

### **🛠️ Developer Guides**

- **[API Development Guide](./docs/developer-guides/api-development.md)** - Development patterns and best practices
- **[Library Architecture](./src/lib/README.md)** - Core libraries and utilities
- **[Hooks Library](./src/hooks/README.md)** - Custom React hooks

### **🔒 Security & Operations**

- **[Security Documentation](./docs/security.md)** - Security best practices and configuration
- **[Rate Limiting](./docs/rate-limiting.md)** - API rate limiting and storage setup
- **[Flash Messages](./docs/flash-messages.md)** - Temporary notifications system

### **🗄️ Database & Components**

- **[Database Documentation](./docs/database/)** - Database operations and schema management
  - **[Database Recreation](./docs/database/database-recreation.md)** - Guide for recreating database
- **[Component Documentation](./docs/components/)** - UI component library documentation
  - **[Avatar Components](./docs/components/avatar.md)** - Profile picture management

### **🔧 Library Documentation**

- **[Logger System](./src/lib/logger/README.md)** - Structured logging with Pino
- **[Supabase Integration](./src/lib/supabase/README.md)** - Database and auth layer
- **[Utils Library](./src/lib/utils/README.md)** - Common utility functions
- **[Validators Library](./src/lib/validators/README.md)** - Zod validation schemas
- **[Middleware Library](./src/middleware/README.md)** - Application middleware
- **[Security Utilities](./src/middleware/security/README.md)** - Security middleware and utilities
- **[Auth Actions](./src/lib/actions/auth/README.md)** - Authentication server actions

Auth consumption (client)

- **Use `useCurrentUser()`** in client components to read authentication state (user object, loading state). Import from `@/components/providers`.
- **Use `useAuthContext()`** for full auth context including `signOut` and other auth actions.
- `useAuth()` builds the auth instance and is used internally by `AuthProvider`.

### **🛠️ Development Tools**

- **[Scripts Directory](./scripts/README.md)** - Type generation and build scripts
- **[Database Migrations](./supabase/README.md)** - Database schema migrations

### **📋 Project Management**

- **[Roadmap](./docs/ROADMAP.md)** - Development backlog and future features
- **[Changelog](./CHANGELOG.md)** - Version history and changes

### **📋 General Guides**

- **[Contributing Guidelines](./CONTRIBUTING.md)** - How to contribute
- **[Development Guidelines](./AGENTS.md)** - AI development context and patterns (Source of Truth)
- **[API Documentation](./docs/api.md)** - Complete API reference
- **[Authentication Providers](./docs/authentication-providers.md)** - Authentication options
- **[Error Handling](./src/lib/error/README.md)** - Error management patterns

## 🎯 **Using YwyBase as a Starting Point**

### **1. Clone and Customize**

```bash
# Clone the template
git clone https://github.com/mmerlone/ywybase.git your-project
cd your-project

# Update package.json with your project info
npm pkg set name="your-project-name"
npm pkg set description="Your project description"
npm pkg set repository="https://github.com/your-name/your-project"

# Install dependencies
pnpm install
```

### **2. Set Up Environment Variables**

```bash
# Copy the sample environment file
cp .env.sample .env.local

# Edit the file with your actual API keys
nano .env.local  # or use your preferred editor
```

#### **Required: Supabase Setup**

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Sign up and create a new project
   - Choose your database region

2. **Get Supabase Credentials**
   - Go to Project Settings → API
   - Copy **Project URL** and **anon public** key
   - Extract **Project ID** from your URL (e.g., `https://[project_id].supabase.co`)
   - Update your `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your_supabase_project_id.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
   SUPABASE_PROJECT_ID=your_supabase_project_id
   ```

#### **Optional: Sentry Error Tracking**

1. **Initialize Sentry Plugin**

   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

   This will create `.env.sentry-build-plugin` file and configure Sentry for your project. After running the wizard, ensure you set the `NEXT_PUBLIC_SENTRY_DSN` environment variable in your `.env.local` file.

2. **Create Sentry Project**
   - Go to [sentry.io](https://sentry.io)
   - Create a new organization and project
   - Select "Next.js" as the platform

3. **Get Sentry Credentials**
   - Go to Settings → Client Keys (DSN)
   - Copy the DSN value
   - Go to Settings → Auth Tokens
   - Create a new auth token with required permissions
   - Update your `.env.local`:

   ```env
   NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
   SENTRY_AUTH_TOKEN=your_sentry_auth_token
   ```

4. **Complete Setup**
   - The wizard will automatically configure:
     - `sentry.client.config.ts` and `sentry.server.config.ts`
     - `next.config.mjs` with Sentry webpack plugin
     - `instrumentation.ts` for performance monitoring
   - For detailed setup guide, see [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

#### **Optional: IP Geolocation**

1. **Get IPGeolocation API Key**
   - Go to [ipgeolocation.io](https://ipgeolocation.io)
   - Sign up for a free account (30,000 requests/month)
   - Go to Dashboard → API Keys
   - Update your `.env.local`:
   ```env
   IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key
   ```

#### **Security Configuration**

1. **Generate CSRF Secret**
   - Generate a secure random string (32+ characters)
   - Use OpenSSL or similar tool:

   ```bash
   # Generate CSRF secret
   openssl rand -hex 32
   ```

   - Update your `.env.local`:

   ```env
   CSRF_SECRET=your_generated_csrf_secret
   ```

   - **Required in production** - Application will fail to start without it

2. **Configure Rate Limiting (Production)**
   - For production deployments with multiple instances, configure persistent storage for rate limiting.
   - **Recommended: Vercel KV**
     1. Go to [Vercel Dashboard -> Storage](https://vercel.com/dashboard/stores).
     2. Create a new **KV** database and connect it to your project.
     3. Add the generated environment variables to your Vercel project:
        - `KV_REST_API_URL`
        - `KV_REST_API_TOKEN`
     4. Confirm the variables are available in the same environment where your app runs.
   - **Development**: Uses in-memory storage (no configuration needed)

#### **Complete Environment Setup**

Your `.env.local` should look like this:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your_project_id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_project_id

# Optional
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
SUPABASE_SECRET_KEY=your_supabase_secret_key
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token
LOG_LEVEL=info
NODE_ENV=development
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Production Rate Limiting (Vercel KV)
# KV_REST_API_URL=your_vercel_kv_rest_api_url
# KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
```

### **3. Customize the Application**

#### **Update Site Configuration**

```typescript
// src/config/site.ts
export const SITE_CONFIG = {
  name: 'Your App Name',
  description: 'Your app description',
  url: 'https://yourapp.com',
  theme: 'concrete', // Options: 'concrete' | 'ywybase'
  // ... other config
}
```

#### **Theme Management**

YwyBase supports multiple themes. The theming system is built on Material UI and allows for easy switching and expansion.

**Adding a New Theme:**

1. Create a new theme file in `src/themes/`:

   ```typescript
   // src/themes/my-theme.ts
   import { createTheme } from '@mui/material/styles'

   export const myTheme = createTheme({
     // ... your theme customization
   })
   ```

2. Run the theme generator script:

   ```bash
   pnpm gen:themes
   ```

3. Update `src/config/site.ts` to use your new theme:
   ```typescript
   export const SITE_CONFIG = {
     // ...
     theme: 'my-theme',
   }
   ```

#### **Architecture Examples**

**Server Components:**

```typescript
import { getProfile } from '@/lib/actions/profile'

export default async function ProfileServerComponent({ userId }: { userId: string }) {
  const result = await getProfile(userId)
  const profile = result.success ? result.data : null

  return <div>{profile?.display_name ?? 'No profile found'}</div>
}
```

**Client Components:**

```typescript
import { useProfile } from '@/hooks/useProfile'

export default function ProfileClientComponent({ userId }: { userId: string }) {
  const { profile, isLoading, error, updateProfile } = useProfile(userId)

  if (isLoading) return <div>Loading...</div>
  return <div>{profile?.display_name}</div>
}
```

**Server Actions:**

```typescript
'use server'
import { createClient } from '@/lib/supabase/server'
import { withServerActionErrorHandling, createServerActionSuccess } from '@/lib/error/server'
import { profileUpdateSchema } from '@/lib/validators/profile'
import type { AuthResponse } from '@/types/error.types'
import type { Profile } from '@/types/database'

export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: Partial<Profile>): Promise<AuthResponse<Profile>> => {
    const validated = profileUpdateSchema.safeParse(updates)
    if (!validated.success) {
      return { success: false, error: 'Invalid profile data' }
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').update(validated.data).eq('id', userId).select().single()

    if (error) throw error
    return createServerActionSuccess(data, 'Profile updated')
  }
)
```

#### **Add Your Features**

```typescript
// Add new pages in app/
// Add new components in src/components/
// Add new hooks in src/hooks/ - use hooks for client state management
```

### **4. Development Workflow**

```bash
# Development
pnpm dev

# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format

# Build
pnpm build
```

## **Core Dependencies**

### **Frontend**

- **Next.js 15.5.x** - React framework
- **React 18.3.x** - UI library
- **Material UI 7.3.x** - Component library
- **TypeScript 5.x** - Type safety

### **Backend & Data**

- **Supabase** - Database and auth
- **PostgreSQL** - Database
- **TanStack Query** - Data fetching (in hooks)
- **React Hook Form** - Form handling
- **Zod** - Schema validation

### **Development**

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **Sentry** - Error tracking

## 🚀 **Deployment**

### **Vercel (Recommended)**

```bash
# Push to GitHub
git add .
git commit -m "Initial setup"
git push origin main

# Connect to Vercel
# Add environment variables in Vercel dashboard
# Deploy automatically on push
```

### **Environment Variables**

#### **Required Variables**

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_supabase_project_id
```

#### **Optional Variables**

```bash
# Development
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
LOG_LEVEL=info
NODE_ENV=development

# Sentry (Error Tracking)
SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# IP Geolocation
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key

# Security Configuration
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Rate Limiting (Production - choose one)
# KV_REST_API_URL=your_vercel_kv_rest_api_url
# KV_REST_API_TOKEN=your_vercel_kv_rest_api_token
# REDIS_URL=redis://your-redis-host:6379

# Supabase Secret Key (Server-side only)
SUPABASE_SECRET_KEY=your_supabase_secret_key
```

> **🔧 Setup Guide**: See the detailed environment setup section above for step-by-step instructions on obtaining each API key.

## 🔧 **Available Scripts**

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm gen:themes       # Generates the theme index

# Code Quality
pnpm lint             # Run ESLint
pnpm lint:fix         # Fix ESLint errors
pnpm type-check       # Run TypeScript type checking
pnpm format           # Format code with Prettier
pnpm format:check     # Check code formatting without modifying files

# Type Generation
pnpm gen:types        # Generate Supabase database types (auto-runs inside pnpm db:init)
pnpm generate:i18n-types  # Generate i18n translation types
pnpm watch:i18n       # Watch i18n files and auto-generate types

# Database Management
pnpm db:init              # Apply migrations to remote database
pnpm db:init --status     # Check migration status
```

### **Type Generation Scripts**

#### **Supabase Types**

```bash
pnpm run gen:types
```

Generates TypeScript types from your Supabase database schema. Run this after:

- Creating new tables
- Modifying table structures
- Adding new columns

#### **Theme Generation**

```bash
pnpm run gen:themes
```

Generates the theme index file that exports all available themes from `src/themes/`. Run this after:

- Adding new theme files in `src/themes/`
- Removing theme files
- Renaming theme files

**How it works**:

- Scans the `src/themes/` directory for all `.ts` files (excluding `index.ts`)
- Automatically generates `src/themes/index.ts` with exports for all themes
- Ensures all themes are properly exported and accessible

**Example**:

```bash
# After creating a new theme file: src/themes/my-custom-theme.ts
pnpm run gen:themes

# The generated index.ts will now include:
# export { myCustomTheme } from './my-custom-theme'
```

#### **i18n Types**

```bash
pnpm run generate:i18n-types
```

> **⚠️ Note**: This script is currently not implemented and is a placeholder for future functionality.

> **📋 Status**: Internationalization (i18n) features are **not yet implemented** in this project. The i18n infrastructure exists but is not actively used. Translation files and i18n configuration are placeholders for future implementation.

Generates TypeScript types from translation files. Run this after:

- Adding new translation keys
- Modifying translation structure
- Adding new languages

#### **i18n Watcher**

```bash
pnpm run watch:i18n
```

> **⚠️ Note**: i18n features are not yet implemented. This script is a placeholder.

Watches for changes in translation files and auto-generates types. Use during development when working on translations.

### **Database Initialization**

#### **Apply Migrations**

```bash
pnpm run db:init
```

Applies pending migrations to your remote Supabase database using Supabase CLI. This script:

- **Uses Supabase migrations**: Applies all pending migrations from `supabase/migrations/`
- **Incremental and safe**: Only applies migrations that haven't been run yet
- **Version controlled**: Migrations are tracked in your codebase
- **Official tooling**: Uses `npx supabase db push` under the hood

**Check Migration Status**:

```bash
pnpm run db:init --status
```

Shows which migrations have been applied and which are pending.

**Reset Database** (⚠️ **DANGER**: Drops all data):

```bash
pnpm run db:init --reset
```

> **⚠️ Warning**: This command shows instructions but requires manual confirmation for safety.

**Requirements**:

- Supabase CLI (installed automatically via npx)
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_PROJECT_ID`, `SUPABASE_DB_PASSWORD`
- Migration files in `supabase/migrations/`

**Complete Setup Workflow**:

```bash
# 1. Apply migrations and regenerate types
pnpm run db:init

# 2. Check migration status
pnpm run db:init --status
```

**Creating New Migrations**:

```bash
# Create a new migration file
npx supabase migration new add_user_preferences

# Edit the generated file in supabase/migrations/
# Then apply it
pnpm run db:init
```

### **Database Maintenance (Supabase CLI)**

Custom backup/restore scripts have been removed in favor of Supabase's native tooling. Use the Supabase CLI or dashboard when you need to perform operations beyond migrations.

#### **Build a Database URL**

```bash
export SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
```

#### **Create a Schema Backup**

```bash
# Dumps the public schema to a timestamped file
mkdir -p backups
npx supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_schema.sql
```

#### **Create a Full Backup**

```bash
npx supabase db dump --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_full.sql
```

> Supabase CLI streams SQL to stdout. Redirect output to a file (as shown above) or pipe it to cloud storage. Refer to [Supabase db dump docs](https://supabase.com/docs/guides/cli/local-development#dump-the-database) for additional flags (e.g., excluding schemas or data-only dumps).

#### **Resetting / Recreating the Database**

```bash
# Danger: drops all data in the remote database
npx supabase db reset --db-url "$SUPABASE_DB_URL"

# Re-apply your schema via migrations (automatically regenerates Supabase types)
pnpm run db:init
```

> If your Supabase plan does not allow CLI resets, use the Supabase dashboard's "Reset Database" button and then re-run `pnpm run db:init`.

#### **Restoring from a Backup**

```bash
psql "$SUPABASE_DB_URL" < backups/20250101000000_full.sql

# After restoring manually, re-run migrations if needed
pnpm run db:init --status
```

Manual restoration is rarely needed because your schema should be reproducible via migrations. Prefer wiping/resetting and re-applying migrations whenever possible.

### **PostgreSQL Client Installation (Ubuntu)**

For optimal compatibility with Supabase, install the latest PostgreSQL client tools from the official repository:

```bash
# Add PostgreSQL official repository
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'

# Import repository signing key
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg

# Update package lists
sudo apt update

# Install PostgreSQL client tools
sudo apt install postgresql-client

# Verify installation
pg_dump --version
```

**Alternative Installation Methods:**

- **macOS**: `brew install libpq` or `brew install postgresql`
- **Windows**: Download from [postgresql.org](https://www.postgresql.org/download/windows/)
- **Other Linux**: Follow [official PostgreSQL documentation](https://www.postgresql.org/download/linux/)

**Backup Organization:**

```
backups/
├── project_id_schema_backup_2025-01-15T10-30-00-000Z.sql
├── project_id_schema_backup_2025-01-15T10-30-00-000Z_summary.json
├── project_id_full_backup_2025-01-15T10-30-00-000Z.sql
└── project_id_full_backup_2025-01-15T10-30-00-000Z_summary.json
```

## 🛡️ **Security Features**

- **Row Level Security (RLS)** - Database-level access control
- **Session Management** - Secure cookie-based sessions
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Validation** - Zod schema validation
- **Security Headers** - Comprehensive header management

## 🧩 Components

- **[Auth Components](/src/components/auth/README.md)** - Complete authentication system including login, registration, and password reset flows
- **UI Components** - Reusable UI elements built with Material UI
- **Layout Components** - Page layouts and navigation

## 📱 **Responsive Design**

Mobile-first approach with Material UI breakpoints:

- **xs**: 0px and up
- **sm**: 600px and up
- **md**: 900px and up
- **lg**: 1200px and up
- **xl**: 1536px and up

## ♿ **Accessibility**

WCAG 2.1 compliant with:

- Semantic HTML elements
- Proper ARIA attributes
- Keyboard navigation
- Screen reader support
- Color contrast compliance

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Read [Contributing Guidelines](./CONTRIBUTING.md) for details.

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 🙏 **Acknowledgments**

- [Next.js](https://nextjs.org/) - The React framework
- [Material UI](https://mui.com/) - React component library
- [Supabase](https://supabase.com/) - Backend as a Service
- [React Hook Form](https://react-hook-form.com/) - Form library
- [Zod](https://zod.dev/) - Schema validation

---

**🎉 Happy coding!**
