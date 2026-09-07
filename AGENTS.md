# YwyBase Agent Guidelines

This file contains durable engineering rules for work in this repository. Use the
canonical documentation for details that change more often:

- Project organization: [docs/structure.md](docs/structure.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Authentication: [docs/authentication-flows.md](docs/authentication-flows.md)
- Security: [docs/security.md](docs/security.md)
- API development: [docs/developer-guides/api-development.md](docs/developer-guides/api-development.md)

## Commands

Use `pnpm` for all package and project commands. Do not use npm or yarn.

```bash
pnpm dev
pnpm lint
pnpm type-check
pnpm build
pnpm test
pnpm format:check
```

Run the narrowest relevant check after an edit. For a completed coding task,
run at least lint and typecheck; run the build when routing, configuration,
providers, Server Components, or shared infrastructure changed.

## Testing

- Run the test suite with `pnpm test`.
- Keep tests close to the behavior they cover and follow the existing
  `*.test.ts` and `*.test.tsx` naming convention.
- Test error paths, structured error responses, and loading or error boundary
  states when changing those behaviors.

## Core Principles

- Keep the data flow layered: components -> hooks -> server actions -> database.
- Prefer Server Components. Add `"use client"` only for interactivity, hooks,
  browser APIs, or client-only libraries.
- Keep server/client boundaries explicit. Do not pass ordinary functions or
  client component references as props from a Server Component to a Client
  Component. Server Actions are the intentional exception.
- Prefer existing project and framework primitives over new wrappers or
  workarounds. Before adding an abstraction, search for an established local
  pattern and verify the real boundary that requires it.

## Semantic UI And Navigation

- Choose elements by meaning, not appearance. Use buttons for actions that
  change state or submit work; use links for navigation.
- Do not use a button as a navigation link merely to obtain button styling.
  Use `next/link` for internal navigation and style the link when needed.
- Do not wrap one link inside another link. A navigable card should be one
  semantic anchor with its visual content inside it.
- Internal routes must use Next.js client navigation. A MUI `Link` or `Button`
  with an internal `href` is not automatically a Next link; use a direct
  `next/link` or an established client-side adapter where the component API
  requires one.
- Keep Server Components server-rendered when possible. If a library requires
  a function-valued component prop such as `component={NextLink}`, isolate
  that prop in a small Client Component or use a semantic outer `next/link`.
  Do not make an entire page or card client-side just to adapt one link.
- Use native anchors for external URLs. Add `target="_blank"` and an
  appropriate `rel` value only when opening a new tab is intentional.

## Server And Client Components

- MUI components are SSR-compatible; importing MUI alone does not justify
  `"use client"`.
- Check the boundary before passing callbacks, render functions, slot
  components, or component constructors through props.
- When a Server Component needs a client-only interaction, keep the interactive
  portion in the smallest possible client leaf and pass serializable props.
- Prefer explicit interfaces and return types. Avoid `any`, unjustified type
  assertions, and `unknown` casts.

## Theme And Color Modes

- Use the existing MUI theme provider, color schemes, and `InitColorSchemeScript`.
  Do not introduce a second theme system or manually manage MUI's storage key.
- MUI owns the `mui-mode` preference. The value `system` is the preference;
  the active `light` or `dark` class is resolved from the operating-system
  preference.
- Treat database theme preferences as asynchronous application state unless
  they are explicitly provided by the server. Do not assume a client profile
  query is available during SSR.
- Use semantic palette tokens such as `text.primary`, `background.paper`,
  and `divider` for component styles.
- For CSS that must react to light, dark, and system modes, use
  `theme.vars.palette` or the generated palette channel variables. Do not build
  dynamic CSS from `theme.palette.*` snapshots, and do not pass CSS variables to
  MUI's `alpha()` helper, which expects concrete colors. Prefer native CSS
  `rgb(channel / alpha)` or `color-mix()` at the usage site.
- On logout, update the MUI mode before refreshing or navigating so a provider
  remount cannot render with stale user state. Keep synchronization effects
  idempotent and do not overwrite a manual selection on every render.
- Avoid hardcoded white, black, or dark-only gradients in reusable components.
  Brand colors and image overlays may be fixed when their semantics require it;
  normal content surfaces and text must follow the theme.

## Data, Auth, And Database

- Use the context-appropriate Supabase client: server, client, or middleware.
  Never mix them.
- In Server Components, Server Actions, and API routes use the server Supabase
  client; in Client Components use the client Supabase client; middleware uses
  its middleware-specific client.
- Validate external input with the repository's Zod validators before database
  or server-action work.
- Use generated database types. Let the database manage `created_at` and
  `updated_at`; do not set them in application updates.
- Use React Query for client server-state and pass required identifiers directly
  to hooks instead of hiding them in ambient context.
- Apply optimistic updates only with rollback and appropriate invalidation.
- Preserve centralized error handling. Server Actions, API routes, and client
  code must use the corresponding repository error wrappers and include an
  operation name in error context.
- Use structured logging with the context object first and the message second:

  ```ts
  logger.info({ userId }, 'Profile loaded')
  logger.error({ error, userId }, 'Profile update failed')
  ```

## Styling And Accessibility

- Follow existing MUI and CSS conventions. Use `sx` for local one-off styles
  and shared theme definitions for reusable variants.
- Preserve keyboard focus, visible focus states, semantic heading order, and
  accessible names when replacing controls or navigation.
- Avoid styling hacks that create invalid interactive markup, duplicate links,
  or controls whose visible appearance disagrees with their semantics.

## Validation And Review

Before finishing:

- Inspect the diff and ensure unrelated changes are untouched.
- Run focused tests or checks for the changed behavior.
- Run `pnpm lint` and `pnpm type-check`.
- Run `pnpm build` when the change affects shared providers, routing,
  configuration, Server Components, or build-time behavior.
- For UI or navigation changes, verify both keyboard semantics and a browser
  interaction when browser tooling is available.
- Do not commit, reset, or create branches unless explicitly requested.
- Before committing, check that no secrets are hardcoded, external input is
  validated, authentication and authorization checks are present, and error
  messages do not expose sensitive information.

When reviewing code, lead with concrete bugs, regressions, boundary violations,
security risks, and missing tests. Keep summaries secondary to actionable
findings.

## Repository Conventions

- Follow the naming and import conventions already enforced by the repository
  and documented in the canonical guides.
- Keep comments short and explain only non-obvious constraints.
- Update documentation when a durable project convention changes; do not copy
  volatile dependency versions, route inventories, directory trees, or
  environment-value catalogs into this file.

## Anti-Patterns

- Do not mix the Pages Router with the App Router or create routes outside
  `app/`.
- Do not use `any` or ignore TypeScript and lint errors without a documented,
  justified exception.
- Do not hardcode secrets or environment-specific configuration.
- Do not catch errors only to log them; use the repository error-handling
  utilities and let errors reach the appropriate boundary.
- Do not expose sensitive server data or non-serializable values across a
  Server Component to Client Component boundary.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
