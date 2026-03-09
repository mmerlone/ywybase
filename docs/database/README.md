# Database Documentation

This directory contains comprehensive documentation for YwyBase database schema, functions, and operational procedures.

## 📋 Documentation Files

### **[Database Recreation Guide](./database-recreation.md)**

- Complete database recreation procedures
- Schema migration steps
- Data backup and restore operations
- Environment-specific configurations

---

## 🗄️ Database Schema Overview

The YwyBase database uses a dual-table architecture:

### **Core Tables**

#### `public.profiles` (Canonical Source)

Primary user profile table containing authoritative user data:

```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  theme TEXT DEFAULT 'system',
  created_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  banned_until TIMESTAMPTZ,
  providers TEXT[],
  status TEXT DEFAULT 'active',
  role public.user_role DEFAULT 'user',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `auth.users` (Supabase Authentication)

Supabase's built-in authentication table with synced metadata:

```sql
-- Key synced fields (from profiles):
- phone: User's phone number
- raw_user_meta_data->'full_name': Display name
- raw_user_meta_data->'name': Display name (duplicate for compatibility)
- raw_app_meta_data->'role': User role with bidirectional sync

-- Auth-only fields:
- id: User UUID (primary key)
- email: User email
- created_at: Account creation timestamp
- confirmed_at: Email verification timestamp
- last_sign_in_at: Last login timestamp
- banned_until: Ban expiration timestamp
- raw_user_meta_data->'avatar_url': Profile picture URL
- raw_user_meta_data->'signup_method': Registration method
```

### **User Roles**

```sql
CREATE TYPE public.user_role AS ENUM (
  'user',       -- Standard user access
  'moderator',  -- Content moderation capabilities
  'admin',      -- Administrative access
  'root'        -- Super administrator access
);
```

---

## 🔧 Core Functions

### **User Management**

#### `handle_new_user()`

**Purpose**: Automatically creates profile when user registers via Supabase Auth
**Triggers**: `AFTER INSERT` on `auth.users`
**Features**:

- Extracts display name from metadata, falls back to email prefix
- Detects signup method from metadata
- Aggregates OAuth providers from `auth.identities`
- Sets default role and status

#### `is_avatar_owner(user_id, object_name)`

**Purpose**: Security function to verify avatar ownership
**Returns**: `BOOLEAN`
**Usage**: Row Level Security policies for avatar access control

### **Data Synchronization**

#### `sync_auth_to_profiles()`

**Purpose**: Manual sync from auth.users to profiles (admin only)
**Updates**: `created_at`, `confirmed_at`, `last_sign_in_at`, `banned_until`, `avatar_url`, `providers`
**Excludes**: `role` (canonical in profiles)

#### `sync_profiles_to_auth()`

**Purpose**: Trigger-based sync from profiles to auth.users
**Triggers**: Manual execution for bulk updates
**Updates**: `phone`, `display_name` (stored as `full_name` and `name`)
**Excludes**: `role` (handled by separate trigger)

### **Utility Functions**

#### `update_updated_at_column()`

**Purpose**: Automatic timestamp updates
**Triggers**: `BEFORE INSERT/UPDATE` on relevant tables
**Function**: Sets `updated_at = NOW()`

---

## 🔒 Security & Access Control

### **Row Level Security (RLS)**

#### Profile Access

```sql
-- Users can only access their own profiles
CREATE POLICY user_own_profile ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Authenticated users can read public profiles
CREATE POLICY profiles_public_read ON public.profiles
  FOR SELECT USING (auth.role() = 'authenticated');
```

#### Avatar Access

```sql
-- Users can only access their own avatars
CREATE POLICY avatars_user_own ON storage.objects
  FOR ALL USING (public.is_avatar_owner(auth.uid()::text, name));
```

### **Role-Based Access**

- **`user`**: Standard access to own data
- **`moderator`**: User management and content moderation
- **`admin`**: Full administrative access
- **`root`**: Super administrator with system-level access

---

## 🔄 Sync Architecture

### **Sync Direction**

#### **Profiles → Auth.users (Canonical Source)**

- `phone` - User's phone number
- `display_name` - Stored as both `full_name` and `name` in auth metadata
- `role` - User's role with bidirectional sync via trigger

#### **Auth.users → Profiles (Synced Fields)**

- `created_at` - Account creation timestamp
- `confirmed_at` - Email verification timestamp
- `last_sign_in_at` - Last login timestamp
- `banned_until` - Ban expiration timestamp
- `avatar_url` - Profile picture URL (from auth metadata)
- `providers` - Authentication providers array (from auth.identities)

### **Sync Mechanisms**

1. **Triggers**: Automatic sync on profile changes
   - `sync_profile_role_to_auth()` - Role changes
   - `handle_new_user()` - New user creation
   - `update_updated_at_column()` - Timestamp updates

2. **Manual Functions**: Administrative sync operations
   - `sync_auth_to_profiles()` - Pull auth data to profiles
   - `sync_profiles_to_auth()` - Push profile data to auth

---

## 📊 Monitoring & Reporting

### **Performance Optimization**

- **Materialized Views**: For frequent sync status queries
- **Indexes**: On sync status and user ID fields
- **Batch Operations**: For large dataset syncs
- **Query Optimization**: Pagination and proper filtering

---

## 🛠️ Development Guidelines

### **Adding New Fields**

1. **Profile Fields**: Add to `public.profiles` table
2. **Auth Sync Fields**: Add to sync functions and triggers
3. **RLS Policies**: Update security policies if needed
4. **Documentation**: Update this README and relevant docs

### **Schema Changes**

1. **Create Migration**: Use timestamped migration files
2. **Test Locally**: Verify with `pnpm db:init`
3. **Update Types**: Run `pnpm gen:types`
4. **Document**: Update relevant documentation

### **Sync Function Development**

```sql
-- Pattern for new sync functions
CREATE OR REPLACE FUNCTION public.your_sync_function()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  -- Your sync logic here
  -- Always include proper error handling
  -- Log operations for audit trail
END;
$$;
```

---

## 🔍 Troubleshooting

### **Common Issues**

#### **Sync Failures**

```sql
-- Check for out-of-sync users
SELECT * FROM public.report_profile_auth_sync()
WHERE sync_status = 'out_of_sync';
```

#### **Permission Errors**

```sql
-- Check RLS policies
SELECT * FROM pg_policies
WHERE tablename = 'profiles'
   OR (schemaname = 'storage' AND tablename = 'objects');
```

#### **Performance Issues**

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
WHERE query LIKE '%profiles%'
ORDER BY total_time DESC
LIMIT 10;
```

### **Recovery Procedures**

1. **Full Sync**: Run `sync_auth_to_profiles()` for manual sync
2. **Role Fix**: Verify role trigger is working correctly
3. **Metadata Repair**: Check auth metadata consistency
4. **Index Rebuild**: Recreate performance indexes if needed

---

## 📚 Related Documentation

- **[Database Recreation Guide](./database-recreation.md)** - Complete recreation procedures
- **[Security Documentation](/docs/security.md)** - Security best practices
- **[API Development Guide](/docs/developer-guides/api-development.md)** - Database patterns

---

**Last Updated**: March 6, 2026
**Version**: 2.0.0 (Updated for schema migration 20250105000000)
