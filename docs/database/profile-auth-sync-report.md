# Profile-Auth Sync Status Report

## Status

Comparison against [supabase/migrations/20250105000000_initial_schema.sql](../../supabase/migrations/20250105000000_initial_schema.sql) shows that the core sync layer already exists:

- `report_profile_auth_sync()`
- `get_sync_summary()`
- `fix_sync_issues()`
- sync triggers for `auth.users`, `auth.identities`, and profile role propagation
- avatar ownership check via `is_avatar_owner()`

The missing work is the operational layer proposed by this report: monitoring tables, alerting, detection triggers, materialized reporting, and dashboard views.

## Missing Enhancements

### 1. Monitoring objects

Not present in the migration:

- `public.sync_health_log` table
- `public.log_sync_health()` function

Purpose:

- persist periodic sync health snapshots
- track critical mismatches over time
- support dashboards without recalculating full reports every time

### 2. Alerting objects

Not present in the migration:

- `public.sync_alerts` table
- `public.create_sync_alert()` function

Purpose:

- store actionable sync incidents
- support severity-based review and resolution workflows

### 3. Detection trigger

Not present in the migration:

- `public.detect_sync_issues()` trigger function
- `detect_profile_sync_issues` trigger on `public.profiles`

Purpose:

- create alerts when profile updates are likely to introduce mismatches

### 4. Performance/reporting objects

Not present in the migration:

- `public.sync_status_mv` materialized view
- indexes on `sync_status_mv`
- `public.refresh_sync_status()` function

Purpose:

- reduce cost of repeated sync report queries
- improve dashboard and admin reporting performance

### 5. Dashboard views

Not present in the migration:

- `public.sync_dashboard` view
- `public.recent_sync_issues` view

Purpose:

- expose a clean read model for admin/maintenance tooling

## Recommended Migration Split

The current initial migration is too broad. Do not keep adding more maintenance features to it. Split the schema into focused setup migrations so app setup stays deterministic and easier to review.

Recommended sequence:

1. `20250105000000_initial_schema.sql`
   - core types
   - `profiles` table
   - base indexes
   - RLS policies
   - storage bucket and policies

2. `20250105000001_profile_auth_sync_core.sql`
   - `handle_new_user()`
   - `sync_auth_to_profiles()`
   - `sync_profiles_to_auth()`
   - `sync_profile_role_to_auth()`
   - `sync_auth_user_updates()`
   - `sync_identities_to_profiles()`
   - related triggers

3. `20250105000002_profile_auth_sync_reports.sql`
   - `report_profile_auth_sync()`
   - `get_sync_summary()`
   - `fix_sync_issues()`
   - grants and function comments

4. `20250105000003_profile_auth_sync_monitoring.sql`
   - `sync_health_log`
   - `log_sync_health()`
   - `sync_dashboard`

5. `20250105000004_profile_auth_sync_alerting.sql`
   - `sync_alerts`
   - `create_sync_alert()`
   - `detect_sync_issues()`
   - `detect_profile_sync_issues` trigger
   - `recent_sync_issues`

6. `20250105000005_profile_auth_sync_performance.sql`
   - `sync_status_mv`
   - materialized view indexes
   - `refresh_sync_status()`

## Clear Action Steps

### Immediate

1. Extract sync reporting functions from the initial migration into a dedicated sync-report migration.
2. Add the missing monitoring migration with `sync_health_log` and `log_sync_health()`.
3. Add the missing alerting migration with `sync_alerts`, `create_sync_alert()`, and the detection trigger.
4. Add the missing performance migration with `sync_status_mv` and `refresh_sync_status()`.

### Cleanup

1. Remove direct client-facing references to this document from official docs navigation.
2. Keep this file as an internal status note only, or delete it once the migrations are created.
3. Avoid further expanding `20250105000000_initial_schema.sql`; use additive follow-up migrations instead.

### Validation

After splitting and adding the missing migrations:

1. Initialize a fresh database from scratch.
2. Verify all triggers compile and execute in order.
3. Run `report_profile_auth_sync()` and `get_sync_summary()` on seeded users.
4. Confirm `sync_status_mv` refreshes successfully.
5. Confirm alert rows are created only for intended mismatch conditions.

## Notes

- The initial migration already covers the core sync model; the missing pieces are operational enhancements, not foundational schema blockers.
- The old draft also contained a broken SQL example in its time-based analysis section; that example should not be reused as-is.
- `GRANT EXECUTE ON FUNCTION public.sync_auth_user_updates()` is unnecessary for normal client access because it is a trigger function.

---

**Last Updated**: 2026-03-06
**Status**: Internal status report
