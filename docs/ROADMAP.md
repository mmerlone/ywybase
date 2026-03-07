# YwyBase Development Backlog

**Last Updated**: March 6, 2026
**Version**: 2.3
**Status**: Active Development

## WIP

### Current codebase concerns

1. Rate limit should be using Vercel KV and must be reviewed.
2. All endpoints should be rate-limited.
3. AI documentation should be enhanced with the full API patterns.
4. Obsolete dead code: review src/lib/supabase/ and the services/ subfolder.

---

## Priority Roadmap (ordered)

### 1) Rate Limiting

**Current state (implemented)**

- Rate limiting utilities and configuration exist (`src/middleware/security/rate-limit.ts`, `src/config/security.ts`).
- Auth endpoints `/api/auth/confirm` and `/api/auth/reset-password` already use rate limiting.
- Rate limiting documentation exists (`docs/rate-limiting.md`, `docs/security.md`).
- Main middleware (`src/middleware/index.ts`) has no rate limiting integration.
- Security middleware exists but does not include rate limiting; API routes rely solely on individual endpoint protection.

**Endpoint coverage** (2 of 6):

| Endpoint                   | Rate Limited |
| -------------------------- | ------------ |
| `/api/auth/confirm`        | ✅           |
| `/api/auth/reset-password` | ✅           |
| `/api/og`                  | ❌           |
| `/api/og/profile`          | ❌           |
| `/api/social-metadata`     | ❌           |
| `/api/sentry-example-api`  | ❌           |

**Gaps**

- No global rate limiting in middleware for `/api/*` routes.
- Remaining API routes are not protected (see table above).
- `validateRateLimitConfig()` exists but is not called at startup.
- Rate limit store uses Upstash Redis environment variables; Vercel KV is documented but not wired in code.
- No rate limit metrics/monitoring.

**Planned work**

_Priority 1 — Critical_

- Add middleware-level rate limiting for all API routes (global protection).
- Protect all remaining API endpoints with `withRateLimit` (route-level defense-in-depth).
- Call `validateRateLimitConfig()` on startup and surface warnings.

_Priority 2 — Important_

- Wire Vercel KV store (primary) and document fallback behavior.
- Add rate limit metrics collection.
- Set up monitoring alerts for high violation rates.

_Priority 3 — Enhancement_

- Implement adaptive rate limiting based on traffic patterns.
- Add admin rate limit management dashboard.

#### User-Specific Quotas

**Story Points**: 5

- Advanced rate limiting with user-specific quotas
- Per-user rate limit configuration
- API quota management
- **Current**: IP-based rate limiting only

---

### 2) Role-Based Access Control (RBAC)

**Current state (implemented)**

- Roles and route gating exist (route config, middleware authorization).
- Role enums are in the type system and used in route filters.

**Gaps**

- Placeholder `hasRole` remains in `useAuth`.
- No permission schema or resource-level permissions.
- No role assignment UI.

#### Permission System

**Story Points**: 13

- Role definition system (Admin, Manager, User, etc.)
- Permission-based access control
- Resource-level permissions
- Role assignment interface
- Database schema for roles and permissions

#### Admin Dashboard

**Story Points**: 13

- User management interface (roles, permissions, status)
- System monitoring and health checks
- Audit log viewer and search
- Configuration management UI
- Site configurations
- **Dependencies**: RBAC system, Audit trail storage

---

### 3) Profile/Auth Sync Monitoring & Remediation

**Current state (implemented)**

- Core sync/report database functions already exist in `supabase/migrations/20250105000000_initial_schema.sql`.
- Existing sync coverage includes `handle_new_user()`, auth/profile sync routines, and reporting/remediation RPCs.
- Dashboard admin infrastructure already exists under `/dashboard`, and `app/dashboard/layout.tsx` already enforces `requireAdmin()`.

**Gaps**

- Sync logic is still bundled into the initial schema migration instead of being split into focused follow-up migrations.
- Monitoring objects are missing: `sync_health_log` and `log_sync_health()`.
- Alerting/detection objects are missing: `sync_alerts`, `create_sync_alert()`, `detect_sync_issues()`, and the `detect_profile_sync_issues` trigger.
- Performance/read-model objects are missing: `sync_status_mv`, `refresh_sync_status()`, `sync_dashboard`, and `recent_sync_issues`.
- Operational access rules are not fully documented (`service_role` only vs admin-readable surfaces, trigger-only execution boundaries, refresh cadence).
- App integration is missing for admin DTOs, server actions, dashboard pages, navigation, and cache/query configuration.

#### Database Enhancements

**Story Points**: 8

- Split the current monolithic migration chain into focused migrations: core schema → sync core → sync reports → monitoring → alerting → performance/read models.
- Add `sync_health_log` plus `log_sync_health()` with grants/comments and deterministic fresh-setup behavior.
- Add `sync_alerts`, `create_sync_alert()`, `detect_sync_issues()`, and `detect_profile_sync_issues` with dedupe/suppression rules.
- Add `sync_status_mv`, supporting indexes, `refresh_sync_status()`, and dependent admin read models.
- Normalize operational rules for privileged execution, refresh cadence, and admin-readable versus `service_role`-only objects.
- Regenerate `src/types/supabase.ts` after the migration split/additions.

#### Admin UI/UX Implementations

**Story Points**: 5

- Add explicit admin DTOs in `src/types/admin.types.ts` for summary cards, incident rows, and per-user mismatch details.
- Extend admin server actions for `report_profile_auth_sync()`, `get_sync_summary()`, `fix_sync_issues()`, and dashboard read-model queries.
- Add a sync overview surface to `app/dashboard/page.tsx` using the existing `DashboardCard` pattern.
- Add a dedicated admin monitoring page under `/dashboard` for sync incidents, remediation actions, and detailed per-user mismatch views.
- Register routes, query keys, cache settings, and dashboard/header navigation so the new monitoring surfaces are discoverable.
- Validate UX and access control so non-admin users cannot access monitoring pages or remediation actions.

**Implementation plan**

- See [docs/plan-profileAuthSyncEnhancement.prompt.md](./plan-profileAuthSyncEnhancement.prompt.md) for the detailed split-migration and dashboard rollout plan.

---

### Compliance & Audit Infrastructure

#### Audit Trail Database Storage

**Story Points**: 8

- Create `audit_logs` table schema in Supabase
- Implement `AuditStorageService` for database operations
- Update audit trail creation to persist entries
- Add audit log querying capabilities

#### Audit Report Generation

**Story Points**: 5

- Audit report generation from database
- Automated log retention enforcement
- Compliance dashboard for administrators

#### Audit Log Export

**Story Points**: 3

- Add audit logs to user data export functionality
- Integrate with existing export API endpoints
- **Note**: User data export (profile, activity) already implemented

---

### Session Management Enhancements

#### Session State Management

**Story Points**: 8

- Concurrent session control (multi-device support)
- Session termination for specific devices
- Session activity tracking and reporting
- **Current**: Basic session handling exists, lacks advanced features

#### Session-Based Rate Limiting

**Story Points**: 5

- Dynamic rate limiting based on user/session state
- Integration between session state and rate limiting
- **Current**: Only IP-based rate limiting exists

#### Enhanced Session Logging

**Story Points**: 3

- Structured session lifecycle logging
- Request ID correlation across all logs
- Audit trail for sensitive session operations
- **Current**: Basic logging exists but inconsistent

---

### Account Security

#### Account Unlock System

**Story Points**: 5

- Automatically unlock accounts after cooldown period
- Admin-triggered account unlock for locked accounts
- Rate limiting with automatic cooldown

**Note**: Email change/update and username recovery features are not planned for this application.

---

### Multi-Tenant Architecture

#### Tenant System

**Story Points**: 21

- Support multiple organizations in single deployment
- Tenant isolation and data separation
- Tenant-specific configuration
- Billing and subscription per tenant

---

### Advanced Security Features

#### Multi-Factor Authentication (MFA)

**Story Points**: 13

- 2FA implementation (TOTP, SMS, WebAuthn)
- MFA enrollment and management UI
- Recovery codes
- **Current**: Supabase config has MFA sections but not implemented

#### Single Sign-On (SSO)

**Story Points**: 8

- SSO integration (SAML, OAuth)
- Enterprise identity provider support
- SSO configuration UI

#### Advanced Threat Detection

**Story Points**: 8

- Anomaly detection in user behavior
- Brute force detection enhancements
- Geographic anomaly detection
- Suspicious activity alerts

---

### Analytics Enhancements

#### Google Analytics 4 Integration

**Story Points**: 3

- GA4 integration with Next.js
- Privacy-compliant tracking configuration
- Custom event tracking
- Performance monitoring
- **Current**: Vercel Analytics is integrated; GA4 would be additional

---

### UI/UX Improvements

#### Responsive Mobile Adaptations (`useIsMobile`)

**Story Points**: 3

The `useIsMobile` hook (`src/hooks/useIsMobile.ts`) exists but is not used anywhere in runtime code. Integrate it where JS-level branching (not CSS-only breakpoints) is needed.

_High priority_

- **Header navigation** (`Header.tsx`): Switch from full button row to compact hamburger menu/drawer on mobile.
- **Users table** (`UsersTable.tsx`): Render a stacked card/list view on mobile instead of the dense table with columns and actions.

_Lower priority_ (already mostly handled via responsive `sx` props)

- `ProfileForm.tsx` — layout breakpoints, not logic branching.
- `UserFilters.tsx` — layout breakpoints, not logic branching.

---

## 📊 **Total Story Points by Category**

- **Compliance & Audit**: 16 points
- **RBAC**: 26 points
- **Profile/Auth Sync**: 13 points
- **Session Management**: 16 points
- **Account Security**: 5 points
- **Rate Limiting**: 5 points
- **Multi-Tenant**: 21 points
- **Advanced Security**: 29 points
- **Analytics**: 3 points
- **UI/UX**: 3 points

**Total Remaining**: 137 story points

---

## 🔄 **Review Notes**

- This document is a living backlog and should be updated as features are completed or requirements change.
- Story points are estimates and may be adjusted based on implementation complexity.
- Dependencies between features should be considered during sprint planning.
- No timeline or priority is assigned—prioritization should be done during planning sessions.

---

**Document Status**: ✅ Active
**Next Update**: As needed
**Version History**:

- v1.0 (December 21, 2025) - Initial roadmap
- v2.0 (January 11, 2026) - Streamlined backlog with story points
- v2.1 (February 5, 2026) - Priority ordering and WIP/status updates
- v2.2 (March 6, 2026) - Merged rate-limiting audit and useIsMobile annotations; added UI/UX section
- v2.3 (March 6, 2026) - Added profile/auth sync monitoring backlog with database and dashboard implementation scope

---

## Plan Review (Temp Attachments)

### Resend verification plan (task.md + RESEND.md)

**Status:** Mostly complete.

**Missing steps / integration gaps**

- Robust link generation using request headers and safe `URL` construction is still pending for `signUpWithEmail`, `resendVerification`, and `forgotPassword`.
- Client-side safety net refinement for `AuthURLHandler.tsx` and global auth redirect monitoring is still pending.
- Final verification remains open: lint, type-check, and manual redirect flow verification.

### Redundant profile fields cleanup (REDUNDANT.md)

**Status:** Partially complete.

**Missing steps / integration gaps**

- Server actions: `getAdminUserDetails()` and `getUserDetails()` still need updates to merge auth verification data.
- Admin dashboard components still reference old verification fields in places.
- Tests and documentation updates are pending, and Supabase types regeneration is not verified.

### Social links feature (SOCIAL.md)

**Status:** Core feature complete.

**Missing steps / integration gaps**

- Enhance fetch OG UX.
- Documentation for social links is still pending.
- Comprehensive tests (unit/integration/e2e) are not implemented.

### Avatar refactor plan (AVATAR.md)

**Status:** Not implemented as specified.

**Missing steps / integration gaps**

- Reusable `UserAvatar` component not found; `AvatarSection` and dashboard avatar rendering remain separate implementations.
- Planned consolidation into a single shared component (and related updates) has not landed.

### Dashboard UX notes (DASHBOARD.md)

**Status:** Outstanding.

**Missing steps / integration gaps**

- Missing provider badge and iconography updates.
- Theme mismatch between local storage and database persists.
- Birth date formatting and privacy/communication layout improvements pending.
- Cookie preference mismatch with local storage pending.
- Social links still need to be integrated into the profile form.
- Account tab still missing provider badge and conditional password form logic.
- Global reusable sidebar and shared user aside component not yet extracted.

### Code review follow-ups (REVIEW.md)

**Status:** Partially addressed.

**Missing steps / integration gaps**

- `last_sign_in_at` sort still fetches all users without pagination (scalability risk).
- Pagination count mismatch remains when auth users are missing.
- Large user details page still needs component extraction.

### Profile-auth sync enhancement plan

**Status:** Planned.

**Tracked scope**

- Split the current auth/profile sync SQL into focused migrations instead of keeping all operational logic in the initial schema file.
- Add the missing sync monitoring, alerting, and materialized reporting layers.
- Expose sync visibility and remediation through admin-only dashboard surfaces under `/dashboard`.

**Plan reference**

- [docs/plan-profileAuthSyncEnhancement.prompt.md](./plan-profileAuthSyncEnhancement.prompt.md)

### User menu UX

- Implement states loading, redirecting, logging out, etc in the user menu items.
