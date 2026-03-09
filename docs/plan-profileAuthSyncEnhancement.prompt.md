## Plan: Profile-auth sync enhancement

DRAFT: Split the current monolithic schema work into focused migrations, add the missing operational sync layer, then expose it through admin-only dashboard surfaces. Based on discovery, the core sync/report functions already exist in [supabase/migrations/20250105000000_initial_schema.sql](../../supabase/migrations/20250105000000_initial_schema.sql), while the missing pieces are monitoring, alerting, detection, materialized reporting, and dashboard read models. Per your choice, this plan assumes the existing initial migration will be rewritten/split rather than kept immutable, and that the scope includes admin UI/server-action integration. This is pre-production stages, we can and will drop the current database and data with no need for a backup.

**Steps**

1. Refactor the database bootstrap into a focused migration chain:
   - Keep core schema objects in [supabase/migrations/20250105000000_initial_schema.sql](../../supabase/migrations/20250105000000_initial_schema.sql)
   - Move sync-core functions/triggers into a new follow-up migration centered on `handle_new_user()`, `sync_auth_to_profiles()`, `sync_profiles_to_auth()`, `sync_profile_role_to_auth()`, `sync_auth_user_updates()`, and `sync_identities_to_profiles()`
   - Move reporting/remediation RPCs `report_profile_auth_sync()`, `get_sync_summary()`, and `fix_sync_issues()` into a dedicated sync-reports migration

2. Add the missing monitoring layer as a separate migration:
   - Create `sync_health_log`
   - Add `log_sync_health()`
   - Define grants/comments for the new objects
   - Keep this migration independent of UI concerns so fresh setup remains deterministic

3. Add the missing alerting/detection layer in its own migration:
   - Create `sync_alerts`
   - Add `create_sync_alert()`
   - Add `detect_sync_issues()` and the `detect_profile_sync_issues` trigger on `profiles`
   - Explicitly define dedupe/suppression rules so sync-fix routines do not create noisy recursive alerts

4. Add the performance/read-model layer in its own migration:
   - Create `sync_status_mv`
   - Add indexes for common admin queries
   - Add `refresh_sync_status()`
   - Create `sync_dashboard` and `recent_sync_issues` only after their dependent tables/functions exist

5. Normalize access and operational rules before wiring the app:
   - Decide which objects are `service_role` only vs admin-readable
   - Review whether trigger-only functions should be executable by clients; specifically revisit `sync_auth_user_updates()`
   - Define refresh cadence for `log_sync_health()` and `refresh_sync_status()` and document whether scheduling is manual or database-driven

6. Regenerate database types and introduce explicit admin DTOs:
   - Regenerate [src/types/supabase.ts](../../src/types/supabase.ts) after the migration split/additions
   - Add app-facing sync monitoring types in [src/types/admin.types.ts](../../src/types/admin.types.ts) for summary cards, incident rows, and per-user mismatch details

7. Add admin data-access for sync monitoring using existing project patterns:
   - Extend [src/lib/actions/admin/users.ts](../../src/lib/actions/admin/users.ts) or add a sibling admin action module for `report_profile_auth_sync()`, `get_sync_summary()`, `fix_sync_issues()`, and any read-model queries
   - Guard mutations with `requireAdminAction()` and wrap them with `withServerActionErrorHandling()`
   - Use `createAdminClient()` from [src/lib/supabase/server.ts](../../src/lib/supabase/server.ts) where privileged access is required

8. Add admin dashboard surfaces in the existing `/dashboard` area:
   - Add a sync overview to [app/dashboard/page.tsx](../../app/dashboard/page.tsx) using the existing `DashboardCard` pattern from [src/components/dashboard/shared/DashboardCard.tsx](../../src/components/dashboard/shared/DashboardCard.tsx)
   - Add a dedicated monitoring page under the dashboard tree, protected by [app/dashboard/layout.tsx](../../app/dashboard/layout.tsx) via `requireAdmin()`
   - If detailed queues/actions are needed, reuse the patterns from [app/dashboard/users/page.tsx](../../app/dashboard/users/page.tsx), [src/components/dashboard/users/UsersManagementClient.tsx](../../src/components/dashboard/users/UsersManagementClient.tsx), and [app/dashboard/users/[profileId]/page.tsx](../../app/dashboard/users/[profileId]/page.tsx)

9. Register navigation and caching support for the new admin surface:
   - Add route entries in [src/config/routes.ts](../../src/config/routes.ts)
   - Add query keys/cache settings in [src/config/query.ts](../../src/config/query.ts)
   - If the page should be discoverable from the dashboard or header, update the relevant navigation surfaces, likely including [src/components/layout/Header.tsx](../../src/components/layout/Header.tsx)

10. Update internal documentation to match the new architecture:

- Keep [docs/database/profile-auth-sync-report.md](profile-auth-sync-report.md) as the status note or retire it once the migrations land
- Add canonical database/sync documentation in [docs/database/README.md](README.md)
- If admin monitoring becomes part of the supported app structure, update [docs/structure.md](../structure.md)
- Optionally correct stale admin-path notes in [src/middleware/README.md](../../src/middleware/README.md)

**Verification**

- Apply migrations on a fresh setup with `pnpm run db:init`
- Check ordering/state with `pnpm run db:init --status`
- Regenerate types with `pnpm run gen:types`
- Validate lint/type safety with `pnpm run lint` and `pnpm run type-check`
- Run `pnpm run build` if dashboard/routes/config files change
- Manual DB validation:
  - run `report_profile_auth_sync()` and `get_sync_summary()` against seeded users
  - confirm `fix_sync_issues()` works in dry-run and real modes
  - confirm `sync_status_mv` refreshes successfully
  - confirm `detect_profile_sync_issues` only creates intended alerts
  - confirm admin-only pages/actions are inaccessible to non-admin users

**Decisions**

- Rewrite and split the existing initial migration rather than leaving it immutable.
- Include admin surfaces, not just schema work.
- Place monitoring under the existing `/dashboard` admin area, not a new `/admin` tree, because [app/dashboard/layout.tsx](../../app/dashboard/layout.tsx) already enforces `requireAdmin()`.
- Keep migrations additive by responsibility after the split: core schema → sync core → sync reports → monitoring → alerting → performance/read models.
