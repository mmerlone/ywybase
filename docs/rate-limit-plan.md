## Plan: Rate limiting for Server Actions

TL;DR - Add server-action-specific rate-limiting helpers and apply them inside auth and profile server actions. Use existing store (Upstash or in-memory) so limits are persistent in production. Prefer identifier-based keys (email) for auth flows to prevent account enumeration and IP-based fallback for resource exhaustion protection.

**Steps**

1. Add helper API to `src/middleware/security/rate-limit.ts`:
   - Export `applyServerActionRateLimit(params)` that accepts `{ keyPrefix, identifier?, ip?, configOverride? }` and returns `RateLimitResult` or throws `RateLimitError` when exceeded.
   - Implementation: reuse `getRateLimitStore()` and `store.increment()`; construct keys as `${keyPrefix}:${identifier ?? ip}`. Merge `configOverride` with `SECURITY_CONFIG.rateLimit[type]` when provided.
   - Add unit-safe logging and `onLimitReached` hook invocation.

2. Add or extend `src/config/security.ts` (if needed):
   - Define `serverActionProfiles` mapping for operations with conservative defaults (e.g., `login`, `signup`, `forgotPassword`, `resendVerification`, `profileOps`). Example: `{ login: { max: 10, windowMs: 15*60*1000 }, signup: { max: 5, windowMs: 60*60*1000 }, forgotPassword: { max: 5, windowMs: 60*60*1000 }, resendVerification: { max: 3, windowMs: 3600*1000 }, profileOps: { max: 300, windowMs: 60*60*1000 } }`.

3. Apply the helper inside server actions:
   - `src/lib/actions/auth/server.ts`: call the helper at the start of `loginWithEmail`, `signUpWithEmail`, `forgotPassword`, and `resendVerification`. Use `validated.data!.email` as `identifier` when present; fallback to header IP via `headers()`.
   - `src/lib/actions/profile.ts` and any profile-related server actions: call the helper for expensive operations (update profile, upload avatar, add/remove connections) keyed by IP and/or userId.
   - Behavior: on limit exceeded, throw a `RateLimitError` (or re-use `RateLimitError` from `src/types/security.types.ts`) so `withServerActionErrorHandling` returns structured error to client.

4. Add middleware-level defense-in-depth for server-action POST endpoints:
   - Update global middleware (if present) to apply a lightweight IP-based throttle for POST requests to page URLs (fails open or returns `429` based on environment). This mitigates mass exploitation before Server Action runs.
   - Keep this permissive so valid flows in development are not blocked.

5. Logging, metrics and monitoring:
   - Emit structured logs on limit triggers with operation name, identifier (hashed email or omitted), IP, and path.
   - Add optional `onLimitReached` callback to send metrics to chosen monitoring (e.g., Sentry breadcrumb, Prometheus/StatsD, or custom logs for Upstash counters).

6. Docs & developer guidance:
   - Update `docs/user-guides/server-actions.md` and any `llms.txt` notes to document server-action rate limiting and show examples for integrating the helper.
   - Add a short migration note for code reviewers to ensure future server actions call the helper when exposing public operations.

**Relevant files (to change or review)**

- `src/middleware/security/rate-limit.ts` — add `applyServerActionRateLimit` helper and exports
- `src/config/security.ts` — add `serverActionProfiles` or extend existing `rateLimit` map
- `src/lib/actions/auth/server.ts` — add calls at top of `loginWithEmail`, `signUpWithEmail`, `forgotPassword`, `resendVerification`
- `src/lib/actions/profile.ts` — protect profile mutation server actions
- `src/middleware/index.ts` or `src/middleware/session.ts` — add lightweight POST throttle (optional)
- `docs/user-guides/server-actions.md` — document new behavior and examples

**Verification**

1. Unit tests for `applyServerActionRateLimit` (mock `setRateLimitStore` with memory store) covering: increment, exceed, and reset.
2. Integration smoke tests: call server actions (`loginWithEmail`, `forgotPassword`) repeatedly to confirm 429/RateLimitError after configured threshold.
3. Run `pnpm run lint` and `pnpm run type-check` and fix issues.
4. Manual verification: perform normal auth flow, verify no false positives, and verify error format returned by server actions on limit triggers.

**Decisions & rationale**

- Use identifier-based keys (email) for auth flows to prevent account enumeration while keeping per-IP fallback to avoid attacker's use of many emails.
- Implement helper inside `rate-limit.ts` rather than trying to parse request body in middleware because Next.js middleware cannot reliably read POST bodies; server actions have full access to parameters and headers.
- Keep middleware POST throttle as permissive fallback (defense-in-depth) but rely primarily on server-action helper for precise controls.

**Further considerations**

1. Consider hashing emails before storing in Redis to avoid storing PII in rate-limit keys/logs.
2. Add adaptive rate limits later (progressively stricter on repeated failure patterns) and per-user quotas for authenticated endpoints.
3. Add metrics export for limit events to enable alerts (high volume of violations -> incident).
