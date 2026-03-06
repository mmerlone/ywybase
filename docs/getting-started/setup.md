# Getting Started Guide

This comprehensive guide will help you set up YwyBase for development and deployment.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: Version 18.17 or later
- **pnpm**: Latest version (recommended package manager)
- **Git**: For version control
- **Supabase Account**: For database and authentication services
- **Code Editor**: VS Code recommended with extensions

### Required VS Code Extensions

```bash
# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension bradlc.vscode-tailwindcss
```

## Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/mmerlone/ywybase.git
cd ywybase

# Install dependencies
pnpm install

# Copy environment variables
cp .env.sample .env.local
```

### 2. Configure Environment Variables

Edit `.env.local` with your configuration:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
SUPABASE_PROJECT_ID=your_supabase_project_id

# Optional: Supabase Secret Key (Server-side only)
SUPABASE_SECRET_KEY=your_supabase_secret_key

# Optional: Sentry for error tracking
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Optional: IP Geolocation
IPGEOLOCATION_API_KEY=your_ipgeolocation_api_key

# Security Configuration (Required in production)
CSRF_SECRET=your_csrf_secret_32_chars_minimum

# Optional: Upstash Redis/KV for rate limiting (production)
KV_REST_API_URL=your_upstash_rest_api_url
KV_REST_API_TOKEN=your_upstash_rest_api_token
```

### 3. Database Setup

```bash
# Initialize database schema
pnpm db:init

# Generate TypeScript types
pnpm gen:types

# Check migration status
pnpm db:init --status
```

### 4. Start Development

```bash
# Start development server with logging
pnpm dev

# Or start without pretty logging
pnpm dev:raw
```

Visit [http://localhost:3000](http://localhost:3000) to see your application.

## Environment Configuration

### Development Environment

For local development, use these settings:

```bash
# .env.local
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
LOG_LEVEL=debug
```

### Production Environment

For production deployment:

```bash
# Environment variables
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com
LOG_LEVEL=info

# Required for production
SUPABASE_SERVICE_ROLE_KEY=your-service-key
REDIS_URL=your-redis-url
```

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your Project URL and API keys

### 2. Configure Authentication

In your Supabase dashboard:

1. Go to **Authentication** → **Settings**
2. Configure **Site URL**: `http://localhost:3000` (development) or your domain (production)
3. Enable **Email confirmations**
4. Configure **Redirect URLs**:
   - `http://localhost:3000/auth/callback`
   - `https://your-domain.com/auth/callback`

### 3. Database Schema

The database schema is automatically created when you run:

```bash
pnpm db:init
```

This applies all migrations from the `supabase/migrations/` directory.

### 4. Row Level Security

RLS policies are automatically applied. Key policies include:

- Users can only access their own profiles
- Authentication tables are properly secured
- Public data has appropriate read access

## Development Workflow

### Code Quality Tools

```bash
# Run linting
pnpm lint

# Auto-fix linting issues
pnpm lint:fix

# Type checking
pnpm type-check

# Format code
pnpm format

# Check formatting without changes
pnpm format:check
```

### Database Operations

```bash
# Generate types from schema
pnpm gen:types

# Backup database schema
pnpm backup:db

# Initialize/reset database
pnpm db:init
```

### Theme Generation

```bash
# Generate theme index after adding/removing themes
pnpm gen:themes

# Generate globe data for timezone component
pnpm gen:globe
```

## Project Structure

Understanding the project structure:

```
ywybase/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Protected routes
│   ├── api/               # API endpoints
│   └── globals.css        # Global styles
├── src/
│   ├── components/        # Reusable components
│   ├── lib/              # Core libraries
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript types
│   └── middleware/       # Next.js middleware
├── docs/                 # Documentation
├── public/               # Static assets
├── supabase/            # Database migrations
└── scripts/             # Utility scripts
```

## Key Development Patterns

### Server Actions

Use Server Actions for data operations:

```typescript
// src/lib/actions/profile.ts
'use server'

import { withServerActionErrorHandling } from '@/lib/error/server'

export const getProfile = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile>> => {
    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) throw error
    return createServerActionSuccess(data)
  },
  { operation: 'getProfile' }
)
```

### Custom Hooks

Use hooks for client-side state:

```typescript
// src/hooks/useProfile.ts
import { useQuery } from '@tanstack/react-query'
import { getProfile } from '@/lib/actions/profile'

export function useProfile(userId: string) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: () => getProfile(userId),
    enabled: !!userId,
  })
}
```

### Component Patterns

Follow the component structure:

```typescript
// src/components/YourComponent.tsx
'use client'

import { useState } from 'react'

export function YourComponent({ prop }: YourComponentProps) {
  const [state, setState] = useState(initialState)

  return (
    <div className="your-component">
      {/* Component JSX */}
    </div>
  )
}
```

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage
```

### Test Structure

```
src/
├── components/
│   └── __tests__/        # Component tests
├── lib/
│   └── __tests__/        # Library tests
└── hooks/
    └── __tests__/        # Hook tests
```

## Deployment

### Vercel Deployment (Recommended)

1. **Connect Repository**:

   ```bash
   # Install Vercel CLI
   npm i -g vercel

   # Link project
   vercel link
   ```

2. **Environment Variables**:

   ```bash
   # Add environment variables
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   ```

3. **Deploy**:
   ```bash
   # Deploy to production
   vercel --prod
   ```

### Docker Deployment

```bash
# Build Docker image
docker build -t ywybase .

# Run container
docker run -p 3000:3000 --env-file .env.local ywybase
```

### Manual Deployment

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Common Issues

#### Database Connection Errors

```bash
# Check Supabase credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

# Test database connection
pnpm db:init --status
```

#### Type Errors

```bash
# Regenerate types
pnpm gen:types

# Check TypeScript
pnpm type-check
```

#### Build Errors

```bash
# Clean build
rm -rf .next
pnpm build

# Check dependencies
pnpm audit
```

### Development Tips

1. **Use pnpm**: Required for consistent dependency management
2. **Environment Variables**: Always use `.env.local` for local development
3. **Database**: Run `pnpm gen:types` after schema changes
4. **Code Quality**: Run `pnpm lint` and `pnpm type-check` before commits
5. **Performance**: Use `pnpm dev` for development with enhanced logging

## Next Steps

After setup:

1. **Explore Documentation**: Read the comprehensive docs in `/docs/`
2. **Review Architecture**: Understand the clean architecture patterns
3. **Customize Components**: Modify components in `/src/components/`
4. **Add Features**: Follow the development patterns for new features
5. **Deploy**: Set up your production deployment

## Support

- **Documentation**: `/docs/` directory
- **Issues**: GitHub Issues
- **Community**: Discord/Slack (if available)

---

**Last Updated**: March 6, 2026
**Version**: 1.0.0
