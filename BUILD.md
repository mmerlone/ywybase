# Build findings and plan

## Summary

The `level:50` build logs are real signals, but the proposed first fix should **not** be to force the dashboard routes dynamic.

After reviewing the profile flow and existing project patterns, the cleaner conclusion is:

- the dashboard is currently mixing **render-time reads** with **server action wrappers**
- that wrapper/logging path is what makes the build output noisy and misleading
- the profile area already shows the simpler project pattern to follow
- `dynamic = 'force-dynamic'` should be a fallback, not the primary fix

## Findings

### 1. The build is succeeding

The build finishes successfully. The problem is not a broken production build. The problem is that dashboard server-render reads are going through an error/logging path that produces misleading high-severity logs during build.

### 2. The noisy logs come from dashboard read actions used during SSR

The affected dashboard pages call admin read functions during server render:

- [app/dashboard/page.tsx](app/dashboard/page.tsx#L15-L17) calls `getDashboardStats()`
- [app/dashboard/users/page.tsx](app/dashboard/users/page.tsx#L24-L40) calls `getUsers()`
- [app/dashboard/users/[profileId]/page.tsx](app/dashboard/users/%5BprofileId%5D/page.tsx#L19-L31) calls `getProfile()`

Those functions live in [src/lib/actions/admin/users.ts](src/lib/actions/admin/users.ts) and are wrapped with `withServerActionErrorHandling()`.

That is the key mismatch: these are being used like server-side query helpers, but they are implemented as server actions with action-oriented logging/error middleware.

### 3. The profile area already uses the simpler pattern

The profile route is the better local reference:

- [app/profile/page.tsx](app/profile/page.tsx#L67-L99) checks auth directly with `createClient()` and fetches initial data on the server
- [app/profile/layout.tsx](app/profile/layout.tsx#L7-L28) prefetches and hydrates React Query using `HydrationBoundary`
- [src/lib/actions/profile.ts](src/lib/actions/profile.ts#L301-L303) exposes `getCachedProfile()` for request-level deduplication

That pattern is much simpler:

- page/layout performs server read work directly
- client components consume hydrated state
- action wrappers are not the center of render-time fetching

### 4. The current dashboard implementation is heavier than the profile implementation

Compared with the profile route, the dashboard currently adds extra layers:

- SSR calls wrapped admin actions from [src/lib/actions/admin/users.ts](src/lib/actions/admin/users.ts)
- `/dashboard/users` manually seeds a `QueryClient` in [app/dashboard/users/page.tsx](app/dashboard/users/page.tsx#L24-L42)
- `UsersManagementClient` creates a second query client/provider in [src/components/dashboard/users/UsersManagementClient.tsx](src/components/dashboard/users/UsersManagementClient.tsx#L126-L160)
- the app already has a global query provider in [app/LayoutClient.tsx](app/LayoutClient.tsx#L75-L77)

So the dashboard path is more complex than the existing project pattern requires.

### 5. The misleading error classification is secondary, not the main architectural problem

There is still a real issue in [src/lib/supabase/server.ts](src/lib/supabase/server.ts): dynamic server usage gets wrapped as configuration failure in some paths.

But that is not the first thing to optimize around. The first improvement should be to stop routing dashboard SSR reads through action middleware.

## Conclusion

My previous suggestion to explicitly make dashboard pages dynamic was too heavy as a first move.

A better, more idiomatic approach for this codebase is:

1. align dashboard reads with the profile pattern
2. reduce the dashboard data-loading stack
3. only add explicit route dynamism if the cleaned-up version still needs it

## Recommended plan

### Phase 1 — Align dashboard SSR reads with profile patterns

Refactor dashboard read paths so server-rendered pages use plain server-side query helpers instead of server action wrappers.

Target files:

- [src/lib/actions/admin/users.ts](src/lib/actions/admin/users.ts)
- [app/dashboard/page.tsx](app/dashboard/page.tsx)
- [app/dashboard/users/page.tsx](app/dashboard/users/page.tsx)
- [app/dashboard/users/[profileId]/page.tsx](app/dashboard/users/%5BprofileId%5D/page.tsx)

Plan:

- keep true mutations like `blockUser()` and `deleteUser()` as server actions
- move read logic for `getDashboardStats()`, `getUsers()`, and `getProfile()` into a server-only admin query module
- let dashboard pages/layouts call those query helpers directly during SSR
- keep admin authorization explicit, but in the server-render path rather than behind server-action middleware

Why:

- matches the simpler profile implementation
- avoids build-time noise from action wrappers
- keeps read and mutation responsibilities separated

### Phase 2 — Simplify React Query hydration on dashboard users

Target files:

- [app/dashboard/users/page.tsx](app/dashboard/users/page.tsx)
- [src/components/dashboard/users/UsersManagementClient.tsx](src/components/dashboard/users/UsersManagementClient.tsx)
- [app/profile/layout.tsx](app/profile/layout.tsx)

Plan:

- replace manual cache seeding with the same `prefetchQuery()` + `HydrationBoundary` pattern already used by the profile area
- remove the nested `QueryClientProvider` if the global provider is sufficient
- keep the server-provided initial state lean and predictable

Why:

- matches existing project conventions
- removes unnecessary dashboard-only complexity
- keeps SSR and client hydration easier to reason about

### Phase 3 — Re-test the build

Run:

- `pnpm build`
- `pnpm lint`
- `pnpm type-check`

Expected outcome:

- dashboard routes still build correctly
- noisy `level:50` logs should be reduced or eliminated
- build output should better reflect actual failures only

### Phase 4 — Only if needed, add explicit dynamic route config

If, after the simplification above, Next.js still needs an explicit segment declaration for the admin area, then add it deliberately to the dashboard segment.

This should be a last step, not the starting point.

## Non-goals for now

- no broad rewrite of auth guards
- no immediate change to the profile route, since it already reflects the preferred project pattern
- no forced `dynamic = 'force-dynamic'` as the first fix
- no large architectural rewrite beyond separating dashboard reads from action wrappers

## Final recommendation

The minimal, solid, idiomatic fix is:

- **do not start by forcing dashboard routes dynamic**
- **first refactor dashboard read paths to follow the profile route pattern**
- **keep server actions for mutations, not render-time reads**
- **only add explicit dynamic route config if the simplified version still requires it**
