# YwyBase Development Backlog

**Last Updated**: February 5, 2026  
**Version**: 2.1  
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

**Gaps**

- No global rate limiting in middleware for `/api/*` routes.
- Remaining API routes are not protected (`/api/og`, `/api/og/profile`, `/api/social-metadata`, `/api/sentry-example-api`).
- `validateRateLimitConfig()` exists but is not called at startup.
- Rate limit store uses Upstash Redis environment variables; Vercel KV is documented but not wired in code.
- No rate limit metrics/monitoring.

**Planned work**

- Add middleware-level rate limiting for all API routes.
- Protect all API endpoints with `withRateLimit` (route-level defense-in-depth).
- Wire Vercel KV store (primary) and document fallback behavior.
- Call `validateRateLimitConfig()` on startup and surface warnings.
- Add basic metrics/monitoring hooks.

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

## 📊 **Total Story Points by Category**

- **Compliance & Audit**: 16 points
- **RBAC**: 26 points
- **Session Management**: 16 points
- **Account Security**: 5 points
- **Rate Limiting**: 5 points
- **Multi-Tenant**: 21 points
- **Advanced Security**: 29 points
- **Analytics**: 3 points

**Total Remaining**: 121 story points

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
- Large user details page still needs component extraction.# YwyBase Development Backlog

**Last Updated**: January 11, 2026  
**Version**: 2.0  
**Status**: Active Development

### **Compliance & Audit Infrastructure**

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

### **Role-Based Access Control (RBAC)**

#### Permission System

**Story Points**: 13

- Role definition system (Admin, Manager, User, etc.)
- Permission-based access control
- Resource-level permissions
- Role assignment interface
- Database schema for roles and permissions
- **Current**: Placeholder `hasRole` function exists but not implemented

#### Admin Dashboard

**Story Points**: 13

- User management interface (roles, permissions, status)
- System monitoring and health checks
- Audit log viewer and search
- Configuration management UI
- Site configurations
- **Dependencies**: RBAC system, Audit trail storage

---

### **Session Management Enhancements**

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

### **Account Security**

#### Account Unlock System

**Story Points**: 5

- Automatically unlock accounts after cooldown period
- Admin-triggered account unlock for locked accounts
- Rate limiting with automatic cooldown

**Note**: Email change/update and username recovery features are not planned for this application.

---

### **Advanced Rate Limiting**

#### User-Specific Quotas

**Story Points**: 5

- Advanced rate limiting with user-specific quotas
- Per-user rate limit configuration
- API quota management
- **Current**: Well-implemented rate limiting exists but no user-specific quotas

---

### **Multi-Tenant Architecture**

#### Tenant System

**Story Points**: 21

- Support multiple organizations in single deployment
- Tenant isolation and data separation
- Tenant-specific configuration
- Billing and subscription per tenant

---

### **Advanced Security Features**

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

### **Analytics Enhancements**

#### Google Analytics 4 Integration

**Story Points**: 3

- GA4 integration with Next.js
- Privacy-compliant tracking configuration
- Custom event tracking
- Performance monitoring
- **Current**: Vercel Analytics is integrated; GA4 would be additional

---

## 📊 **Total Story Points by Category**

- **Compliance & Audit**: 16 points
- **RBAC**: 26 points
- **Session Management**: 16 points
- **Account Security**: 5 points
- **Rate Limiting**: 5 points
- **Multi-Tenant**: 21 points
- **Advanced Security**: 29 points
- **Analytics**: 3 points

**Total Remaining**: 121 story points

---

## 🔄 **Review Notes**

- This document is a living backlog and should be updated as features are completed or requirements change
- Story points are estimates and may be adjusted based on implementation complexity
- Dependencies between features should be considered during sprint planning
- No timeline or priority is assigned—prioritization should be done during planning sessions

---

**Document Status**: ✅ Active  
**Next Update**: As needed  
**Version History**:

- v1.0 (December 21, 2025) - Initial roadmap
- v2.0 (January 11, 2026) - Streamlined backlog with story points

# rate-limiting:

Missing Middleware Integration
Upstash -> Vercel Rate Limiting Vercel KV

No rate limiting in main middleware (src/middleware/index.ts)
Security middleware exists but doesn't include rate limiting
API routes rely solely on individual endpoint protection
Limited Coverage

Only 2 of 6 API endpoints use rate limiting:
/api/auth/confirm ✅
/api/auth/reset-password ✅
/api/og ❌
/api/og/profile ❌
/api/social-metadata ❌
/api/sentry-example-api ❌
Unused Validation

validateRateLimitConfig() function exists but never called
No startup validation of rate limiting configuration
Concerns
⚠️ Limited API endpoint coverage
⚠️ No global rate limiting in middleware
⚠️ Configuration validation not utilized
⚠️ No monitoring/analytics for rate limiting effectiveness

## Recommendations

Priority 1 (Critical)
Add rate limiting to main middleware for global API protection
Protect all remaining API endpoints
Add configuration validation on startup
Priority 2 (Important)
Implement user-specific rate limiting for authenticated endpoints
Add rate limit metrics collection
Set up monitoring alerts for high violation rates
Priority 3 (Enhancement)
Implement session-based rate limiting (roadmap item)
Add admin rate limit management dashboard
Implement adaptive rate limiting based on traffic patterns
