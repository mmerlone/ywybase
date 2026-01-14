# Contributing to YwyBase

Thank you for considering contributing to YwyBase! This guide will help you get started with the project.

> **📋 Note**: For development setup instructions, please refer to the [Quick Start](./README.md#-quick-start) section in the main README.

## Project Structure

> **📋 Reference**: See [Project Structure](./docs/structure.md) for a detailed overview of the project structure and conventions.

## Development Guidelines

Before contributing, please review these essential development resources:

### Development Rules & Standards

The **`.windsurf/rules/`** directory contains extensive development guidelines including:

- Coding standards and conventions
- Architecture guidelines and patterns
- Best practices specific to this project
- Code review criteria and quality standards

### AI Development Context

The **`.cascade/ai-context.md`** file provides important development patterns including:

- Core architectural decisions and rationale
- Implementation guidelines and conventions
- Context for AI-assisted development
- Project-specific development philosophy

> **💡 Important**: These resources are essential for maintaining code consistency and understanding the project's design principles.

## Code Quality

### Linting and Formatting

- We use ESLint with strict TypeScript rules
- Prettier is used for consistent code formatting
- All code must pass the pre-commit hooks before being committed

### Type Safety

- Always provide proper TypeScript types
- Avoid using `any` type - use proper types or `unknown`
- Add return types to all functions
- Enable strict mode in TypeScript

### Git Hooks

We use Husky with the following hooks:

- **pre-commit**: Runs linting and formatting on staged files
- **pre-push**: Runs TypeScript type checking

### VS Code Setup (Recommended)

For the best development experience, we recommend using VS Code with these extensions:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Git Workflow

1. Create a new branch for your feature or bugfix:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them with a descriptive message:

   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push your changes to the remote repository:

   ```bash
   git push origin feature/your-feature-name
   ```

4. Open a pull request against the `main` branch

## Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to the build process or auxiliary tools and libraries

## Code Review Process

1. Create a pull request
2. Ensure all CI checks pass
3. Request reviews from the maintainers
4. Address any feedback
5. Once approved, squash and merge your changes

## Reporting Issues

When reporting issues, please include:

1. A clear title and description
2. Steps to reproduce the issue
3. Expected vs. actual behavior
4. Screenshots or videos if applicable
5. Browser/OS version if relevant

## License

By contributing, you agree that your contributions will be licensed under the project's [LICENSE](LICENSE).
