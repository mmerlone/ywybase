# Profile-Auth Sync Report Documentation

## Overview

The profile-auth sync system maintains data consistency between the canonical `profiles` table and Supabase's `auth.users` table. This document explains the sync mechanisms and provides tools for monitoring and maintaining synchronization.

## Sync Architecture

### Direction of Sync

**Profiles → Auth.users (Canonical Source)**

- `phone` - User's phone number
- `display_name` - Stored as both `full_name` and `name` in auth metadata
- `role` - User's role with bidirectional sync via trigger (includes new 'root' role)

**Auth.users → Profiles (Synced Fields)**

- `created_at` - Account creation timestamp
- `confirmed_at` - Email verification timestamp
- `last_sign_in_at` - Last login timestamp
- `banned_until` - Ban expiration timestamp
- `avatar_url` - Profile picture URL (from auth metadata)
- `providers` - Authentication providers array (from auth.identities)

### Sync Mechanisms

1. **Triggers**: Automatic sync on profile changes
   - `sync_profile_role_to_auth()` - Role changes (supports new 'root' role)
   - `handle_new_user()` - Enhanced new user creation with improved provider detection
   - `update_updated_at_column()`

**Last Updated**: 2025-02-27  
**Version**: 2.1.0 (Updated for schema migration 20250105000000 - Enhanced sync functions, new 'root' role, and avatar ownership security)

2. **Manual Functions**: Administrative sync operations
   - `sync_auth_to_profiles()` - Enhanced auth data to profiles sync with conflict resolution
   - `sync_profiles_to_auth()` - Improved profile data to auth sync with metadata handling

3. **Security Functions**: Access control and ownership verification
   - `is_avatar_owner()` - Avatar ownership verification for RLS policies

## New Sync Report Functions

### 1. `report_profile_auth_sync()`

**Purpose**: Comprehensive sync status report for all users

**Returns**:

- `user_id` - User UUID
- `email` - User email
- `sync_status` - 'in_sync' or 'out_of_sync'
- `out_of_sync_fields` - JSON array of mismatched fields with values
- `profiles_updated_at` - Last profile update timestamp
- `auth_users_updated_at` - Last auth.users update timestamp
- `details` - Summary statistics and breakdown

**Usage**:

```sql
-- Full sync report
SELECT * FROM public.report_profile_auth_sync();

-- Only out-of-sync users
SELECT * FROM public.report_profile_auth_sync()
WHERE sync_status = 'out_of_sync';

-- Users with specific field mismatches
SELECT * FROM public.report_profile_auth_sync()
WHERE out_of_sync_fields ? 'role';
```

### 2. `get_sync_summary()`

**Purpose**: High-level sync statistics

**Returns**:

- `total_users` - Total user count
- `in_sync_count` - Users in sync
- `out_of_sync_count` - Users out of sync
- `sync_percentage` - Percentage of users in sync
- `most_common_mismatches` - Field breakdown of mismatches
- `users_needing_attention` - Users with >2 mismatches

**Usage**:

```sql
SELECT * FROM public.get_sync_summary();
```

### 3. `fix_sync_issues()`

**Purpose**: Automated sync issue resolution (service_role only)

**Parameters**:

- `user_id_param` - Specific user UUID (NULL for all)
- `fix_auth_to_profile` - Fix auth→profile sync issues
- `fix_profile_to_auth` - Fix profile→auth sync issues
- `dry_run` - Preview fixes without applying

**Usage**:

```sql
-- Dry run for all users
SELECT * FROM public.fix_sync_issues(dry_run := true);

-- Fix specific user
SELECT * FROM public.fix_sync_issues('user-uuid-here', dry_run := false);

-- Fix only auth→profile issues
SELECT * FROM public.fix_sync_issues(fix_profile_to_auth := false);
```

## Monitoring Queries

### Daily Health Check

```sql
-- Get overall sync health
SELECT
    sync_percentage,
    out_of_sync_count,
    users_needing_attention
FROM public.get_sync_summary();

-- Top 10 users with most sync issues
SELECT
    email,
    jsonb_array_length(out_of_sync_fields) as issue_count,
    details->'time_difference' as time_diff_seconds
FROM public.report_profile_auth_sync()
WHERE sync_status = 'out_of_sync'
ORDER BY issue_count DESC
LIMIT 10;
```

### Field-Specific Analysis

```sql
-- Most common sync issues by field
SELECT
    elem->>'field' as field_name,
    elem->>'direction' as sync_direction,
    COUNT(*) as occurrence_count
FROM public.report_profile_auth_sync() sd
CROSS JOIN jsonb_array_elements(sd.out_of_sync_fields) elem
GROUP BY field_name, sync_direction
ORDER BY occurrence_count DESC;

-- Users with role sync issues (critical)
SELECT
    user_id,
    email,
    out_of_sync_fields
FROM public.report_profile_auth_sync()
WHERE out_of_sync_fields ? 'role';
```

### Time-Based Analysis

```sql
-- Sync issues by time difference
SELECT
    CASE
        WHEN ABS(details->>'time_difference'::numeric) < 60 THEN '< 1 minute'
        WHEN ABS(details->>'time_difference'::numeric) < 3600 THEN '< 1 hour'
        WHEN ABS(details->>'time_difference'::numeric) < 86400 THEN '< 1 day'
        ELSE '> 1 day'
    END as time_category,
    COUNT(*) as user_count
FROM public.report_profile_auth_sync()
WHERE sync_status = 'out_of_sync'
GROUP BY time_category
ORDER BY user_count DESC;
```

## Proposed Enhancements

### 1. Automated Sync Monitoring

```sql
-- Create sync health table
CREATE TABLE public.sync_health_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    timestamp timestamp with time zone DEFAULT NOW(),
    total_users bigint,
    in_sync_count bigint,
    out_of_sync_count bigint,
    sync_percentage numeric,
    critical_issues jsonb,
    auto_fixed_count bigint DEFAULT 0
);

-- Create function to log sync health
CREATE OR REPLACE FUNCTION public.log_sync_health()
RETURNS void AS $$
BEGIN
    INSERT INTO public.sync_health_log (
        total_users, in_sync_count, out_of_sync_count,
        sync_percentage, critical_issues
    )
    SELECT
        total_users,
        in_sync_count,
        out_of_sync_count,
        sync_percentage,
        jsonb_agg(
            jsonb_build_object(
                'user_id', user_id,
                'email', email,
                'issues', out_of_sync_fields
            )
        ) FILTER (WHERE sync_status = 'out_of_sync' AND jsonb_array_length(out_of_sync_fields) > 2)
    FROM public.report_profile_auth_sync();
END;
$$ LANGUAGE plpgsql;
```

### 2. Sync Alert System

```sql
-- Create sync alerts table
CREATE TABLE public.sync_alerts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT NOW(),
    alert_type text NOT NULL,
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    user_id uuid,
    description text,
    details jsonb,
    resolved_at timestamp with time zone,
    resolved_by uuid
);

-- Function to create sync alerts
CREATE OR REPLACE FUNCTION public.create_sync_alert(
    alert_type_param text,
    severity_param text,
    user_id_param uuid,
    description_param text,
    details_param jsonb
)
RETURNS uuid AS $$
DECLARE
    alert_id uuid;
BEGIN
    INSERT INTO public.sync_alerts (
        alert_type, severity, user_id, description, details
    ) VALUES (
        alert_type_param, severity_param, user_id_param, description_param, details_param
    ) RETURNING id INTO alert_id;

    RETURN alert_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Enhanced Sync Triggers

```sql
-- Create trigger for sync issue detection
CREATE OR REPLACE FUNCTION public.detect_sync_issues()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for critical sync issues on profile update
    IF TG_OP = 'UPDATE' THEN
        -- Add logic to detect and log sync issues
        PERFORM public.create_sync_alert(
            'sync_mismatch',
            'medium',
            NEW.id,
            'Profile update may have caused sync mismatch',
            jsonb_build_object(
                'old_values', row_to_json(OLD),
                'new_values', row_to_json(NEW)
            )
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to profiles table
CREATE TRIGGER detect_profile_sync_issues
    AFTER UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.detect_sync_issues();
```

### 4. Sync Performance Optimization

```sql
-- Create materialized view for sync status
CREATE MATERIALIZED VIEW public.sync_status_mv AS
SELECT * FROM public.report_profile_auth_sync();

-- Create indexes for performance
CREATE INDEX idx_sync_status_mv_status ON public.sync_status_mv (sync_status);
CREATE INDEX idx_sync_status_mv_email ON public.sync_status_mv (email);
CREATE INDEX idx_sync_status_mv_updated_at ON public.sync_status_mv (profiles_updated_at);

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION public.refresh_sync_status()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.sync_status_mv;
END;
$$ LANGUAGE plpgsql;
```

### 5. Sync Dashboard Views

```sql
-- Dashboard summary view
CREATE VIEW public.sync_dashboard AS
SELECT
    sh.timestamp,
    sh.total_users,
    sh.sync_percentage,
    sh.out_of_sync_count,
    CASE
        WHEN sh.sync_percentage >= 95 THEN 'healthy'
        WHEN sh.sync_percentage >= 85 THEN 'warning'
        ELSE 'critical'
    END as health_status,
    sh.critical_issues
FROM public.sync_health_log sh
ORDER BY sh.timestamp DESC
LIMIT 30;

-- Recent sync issues view
CREATE VIEW public.recent_sync_issues AS
SELECT
    sa.created_at,
    sa.severity,
    sa.user_id,
    p.email,
    sa.description,
    sa.details
FROM public.sync_alerts sa
LEFT JOIN public.profiles p ON sa.user_id = p.id
WHERE sa.resolved_at IS NULL
ORDER BY sa.created_at DESC;
```

## Implementation Recommendations

### Phase 1: Monitoring (Immediate)

1. Deploy sync report functions (updated with enhanced conflict detection)
2. Set up daily sync health logging
3. Create dashboard views for monitoring
4. Establish baseline sync metrics
5. Implement avatar ownership verification with `is_avatar_owner()`

### Phase 2: Automation (Short-term)

1. Implement automated sync issue detection
2. Create alert system for critical mismatches
3. Set up materialized views for performance
4. Add automated fix routines for common issues

### Phase 3: Optimization (Long-term)

1. Optimize sync triggers for performance
2. Implement batch sync operations
3. Add sync audit trail
4. Create sync performance metrics

## Security Considerations

- Sync report functions are available to `authenticated` users
- Fix functions require `service_role` permissions
- Consider row-level security for sync reports in multi-tenant setups
- Audit all manual sync operations
- Implement rate limiting for sync operations

## Performance Notes

- Sync report functions can be resource-intensive on large datasets
- Use materialized views for frequent reporting
- Consider pagination for large user bases
- Monitor query performance and optimize as needed
- Schedule sync health checks during low-traffic periods

---

**Last Updated**: 2025-02-27  
**Version**: 2.1.0 (Updated for schema migration 20250105000000 - Enhanced sync functions, new 'root' role, and avatar ownership security)
