# Development Workflow for YwyBase

## Environment Setup

### Prerequisites

- Node.js >= 18.0.0
- pnpm package manager
- Git with SSH keys configured
- Next.js 15.5.x

### Initial Setup

```bash
# Clone the repository
git clone <repository-url>
cd ywybase

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env.local

# Generate Supabase types
pnpm run gen:types

# Start development server
pnpm dev
```

## Daily Development Workflow

### 1. Start Development

```bash
# Start the development server
pnpm dev

# The server runs on http://localhost:3000
# Logs are formatted with pino-pretty
```

### 2. Branch Management

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Merge to main when complete
git checkout main
git merge feature/your-feature-name
git push origin main
```

### 3. Package Management

```bash
# Add new dependency
pnpm add package-name

# Add dev dependency
pnpm add -D package-name

# Remove dependency
pnpm remove package-name

# Update all dependencies
pnpm update
```

## Code Quality Workflow

### Pre-commit Hooks (Automatic)

- ESLint with auto-fix
- Prettier formatting
- TypeScript type checking
- Lint-staged for efficiency

### Manual Quality Checks

```bash
# Run ESLint
pnpm run lint

# Fix ESLint issues
pnpm run lint:fix

# Type checking
pnpm run type-check

# Format code
pnpm run format

# Check formatting
pnpm run format:check
```

## Database Workflow

### Supabase Integration

```bash
# Generate TypeScript types from database
pnpm run gen:types

# Initialize database (apply migrations)
pnpm run db:init

# Initialize database with fresh schema (use --reset flag)
# WARNING! This will destroy and reset the database!
pnpm run db:init --reset

# Check migration status
pnpm run db:init --status

# Generate database backup
pnpm run backup:db
```

### Type Generation

- Run `pnpm run gen:types` after database schema changes
- Types are generated in `src/types/database.ts`
- Always commit generated types

## Testing Workflow

### Running Tests

```bash
# Run all tests
pnpm test

# Note: test:watch and test:coverage scripts are not currently defined in package.json
# To add them, include these scripts in package.json:
# "test:watch": "tsx --test --watch",
# "test:coverage": "tsx --test --coverage"
```

### Test Structure

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- E2E tests: `*.e2e.test.ts`

## Build & Deployment

### Development Build

```bash
# Build for development
pnpm build

# Start production server locally
pnpm start
```

### Production Deployment

```bash
# Build for production
pnpm build

# Output is in standalone mode
# Deploy the .next/standalone directory
```

## Environment Variables

### Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
SUPABASE_SECRET_KEY=your-supabase-secret-key
SUPABASE_PROJECT_ID=your-supabase-project-id

# Development (optional)
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000

# Sentry (optional)
SENTRY_AUTH_TOKEN=your-sentry-token
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn

# Logging
LOG_LEVEL=info
NODE_ENV=development

# Additional Services
IPGEOLOCATION_API_KEY=your-api-key

# Security
CSRF_SECRET=your-csrf-secret-32-chars-minimum

# Upstash Redis (production rate limiting — injected by Vercel/Upstash integration)
KV_REST_API_URL=https://your-endpoint.upstash.io
KV_REST_API_TOKEN=your_kv_rest_api_token
```

## Debugging

### Common Issues

1. **TypeScript Errors**: Run `pnpm run type-check`
2. **Linting Issues**: Run `pnpm run lint:fix`
3. **Build Failures**: Check environment variables
4. **Database Issues**: Regenerate types with `pnpm run gen:types`

### Debug Tools

- React DevTools for component debugging
- Redux DevTools for state management
- Network tab for API debugging
- Console for Pino logs

## Performance Monitoring

### Development

- Use React DevTools Profiler
- Check bundle size with `next build`
- Monitor API response times

### Production

- Sentry for error tracking
- Vercel Analytics for performance metrics
- Supabase dashboard for database performance

## Security Checklist

### Before Committing

- [ ] No hardcoded secrets
- [ ] Environment variables properly set
- [ ] Input validation implemented
- [ ] Authentication checks in place
- [ ] Error messages don't leak sensitive info

### Regular Security Tasks

- Update dependencies regularly
- Review Supabase RLS policies
- Check for security advisories
- Audit authentication flows

## Common Commands Reference

### Package Management

```bash
pnpm install              # Install all dependencies
pnpm add <package>        # Add dependency
pnpm add -D <package>     # Add dev dependency
pnpm remove <package>     # Remove dependency
pnpm update               # Update dependencies
```

### Development

```bash
pnpm dev                  # Start dev server
pnpm build                # Build for production
pnpm start                # Start production server
```

### Code Quality

```bash
pnpm run lint            # Run ESLint
pnpm run lint:fix        # Fix ESLint issues
pnpm run type-check      # TypeScript type checking
pnpm run format          # Format with Prettier
pnpm run format:check    # Check formatting
```

### Database

```bash
pnpm run gen:types       # Generate Supabase types
```

### Git Hooks

```bash
pnpm run prepare         # Install Husky hooks
pnpm run pre-commit      # Run pre-commit hooks manually
```

## IDE Configuration

### VS Code Extensions (Recommended)

- TypeScript and JavaScript Language Features
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer
- GitLens

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.includePackageJsonAutoImports": "auto",
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## Troubleshooting

### Common Issues and Solutions

#### 1. "Module not found" errors

```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### 2. TypeScript errors after database changes

```bash
# Regenerate types
pnpm run gen:types

# Restart TypeScript server in IDE
```

#### 3. ESLint/Prettier conflicts

```bash
# Reset formatting
pnpm run format:check
pnpm run lint:fix
```

#### 4. Environment variable issues

```bash
# Check .env.local exists
ls -la .env.local

# Verify required variables
grep -E "SUPABASE|SENTRY" .env.local
```

## Getting Help

### Resources

- Project documentation: `docs/structure.md`
- Next.js documentation: https://nextjs.org/docs
- MUI documentation: https://mui.com/
- Supabase documentation: https://supabase.com/docs

### Team Communication

- Use descriptive commit messages
- Include context in PR descriptions
- Ask questions in team channels
- Document decisions in project files

---

**Note**: For complete development guidelines and project patterns, see **[AGENTS.md](../../AGENTS.md)** as the source of truth.
