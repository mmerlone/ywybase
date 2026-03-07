# Windsurf Configuration for YwyBase

This directory contains comprehensive Windsurf IDE configuration for the YwyBase project, capturing all project patterns, conventions, and development guidelines.

## Configuration Files

### `project.json`

Complete project metadata including:

- Framework and technology stack
- Dependency versions and relationships
- Project structure and conventions
- Development environment configuration
- Tool configurations

### `rules/project-patterns.md`

Comprehensive project patterns and rules covering:

- Core architecture decisions
- File naming and organization conventions
- Component patterns (Server/Client components)
- Data fetching and state management
- Styling patterns (MUI + Tailwind)
- Authentication and security patterns
- Error handling and logging
- Performance optimization patterns
- Common anti-patterns to avoid

### `rules/ai-guidelines.md`

AI development guidelines including:

- Package management rules (pnpm only)
- TypeScript requirements and patterns
- Code style and quality standards
- MUI component usage guidelines
- React Query best practices
- Form handling patterns
- Logging patterns with Pino
- Error handling integration
- Database timestamp management
- Sentry integration patterns
- Code review checklist

### `rules/development-workflow.md`

Complete development workflow covering:

- Environment setup and prerequisites
- Daily development workflow
- Code quality workflow
- Database workflow with Supabase
- Testing strategies
- Build and deployment processes
- Environment variables configuration
- Debugging and troubleshooting
- Security checklist
- Common commands reference
- IDE configuration recommendations

## Key Project Characteristics

### Technology Stack

- **Next.js 15.5.x** with App Router
- **React 18.3.x** with Server Components
- **TypeScript 5.x** strict mode
- **MUI 7.3.x** with Pigment CSS
- **Tailwind CSS 4.1.x**
- **Supabase** for auth and database
- **React Query 5.90.x** for state management
- **React Hook Form 7.45.x** + Zod validation
- **Pino 10.0.x** for logging
- **Sentry 10** for error tracking

### Core Principles

1. **App Router First** - All routes use Next.js 15 App Router
2. **Server Components Default** - Use Server Components unless client-side is needed
3. **Type Safety** - Full TypeScript with strict mode
4. **Performance** - Optimized with MUI 7 and proper caching
5. **Security** - Comprehensive auth and input validation
6. **Developer Experience** - Excellent tooling and documentation

### Package Management

- **pnpm** is the ONLY package manager
- Never use npm or yarn
- All scripts use `pnpm run` commands

### Project Structure

```
/app                    # Next.js App Router
/src                   # Source code
  /components         # UI components
  /contexts           # React contexts
  /hooks              # Custom hooks
  /lib                # Utilities
  /types              # TypeScript definitions
/scripts              # Build scripts
/public               # Static assets
/supabase             # Database config
```

## Usage in Windsurf

This configuration provides Windsurf with:

1. **Project Context** - Complete understanding of project structure and dependencies
2. **Code Patterns** - Detailed patterns for consistent code generation
3. **Development Rules** - Guidelines for maintaining code quality
4. **Tool Integration** - Proper configuration for all development tools
5. **Best Practices** - Security, performance, and maintainability guidelines

## Integration Benefits

With this configuration, Windsurf can:

- Generate code that follows project patterns
- Suggest appropriate dependencies and versions
- Follow proper file naming and organization
- Implement correct authentication patterns
- Use proper error handling and logging
- Maintain consistent code style
- Generate proper TypeScript types

## Maintenance

This configuration should be updated when:

- Adding new dependencies
- Changing project structure
- Updating patterns or conventions
- Modifying tool configurations
- Adding new development guidelines

Keep this configuration in sync with the actual project to ensure Windsurf provides the most accurate and helpful assistance.

**Source of Truth**: All development guidelines should reference `AGENTS.md` as the canonical source of truth for YwyBase development patterns and rules.
