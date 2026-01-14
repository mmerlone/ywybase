# YwyBase Supabase

This directory contains all Supabase-related files for the YwyBase project, including database migrations, backups, and initialization scripts.

## 📁 **Directory Structure**

```
supabase/
├── backups/                    # Database schema backups (auto-generated)
│   ├── *.sql                  # SQL dumps of database schema
│   └── *_summary.json         # Metadata about each backup
├── init/                      # Database initialization scripts
│   └── init.sql               # Initial database schema
└── migrations/                # Database migrations
    └── *.sql                  # Individual migration files
```

## 🚀 **Database Management**

### **Backups**

The `backups` directory contains automated database schema backups. These are automatically generated and should not be modified manually.

- `.sql` files contain the complete database schema dump
- `_summary.json` files contain metadata about each backup
- Backups are automatically created during deployment and schema changes
- To restore from a backup, use the Supabase dashboard or CLI

### **Initialization Scripts**

The `init` directory contains SQL scripts that run when the database is first created:

- `init.sql` - Sets up the initial database schema, extensions, and configurations
- This script is automatically executed when the database is first created
- For subsequent changes, use migrations instead of modifying this file

### **Migrations**

Database schema migrations for the YwyBase project using Supabase. These are used to evolve the database schema over time.

## 🚀 **Creating New Migrations**

### **Prerequisites**

Before creating migrations, ensure your project is linked to Supabase:

```bash
# Link your project first (if not already linked)
supabase link --project-ref your_project_id

# Verify the connection
supabase status
```

### **Migration Naming Convention**

Use the following format for migration files:

```
YYYYMMDDHHMMSS_descriptive_name.sql
```

**Example:**

- `20251102150000_add_user_profiles_table.sql`
- `20251102153000_create_posts_table.sql`

### **Creating a Migration**

#### **Method 1: Using Supabase CLI (Recommended)**

```bash
# Create a new migration
supabase migration new add_new_feature

# This creates: supabase/migrations/<timestamp>_add_new_feature.sql
```

#### **Method 2: Manual Creation**

```bash
# Create file with proper timestamp format
touch supabase/migrations/$(date +%Y%m%d%H%M%S)_descriptive_name.sql
```

### **Migration Structure**

Each migration file should follow this structure:

```sql
-- Migration: <description>
-- Created: <date>
-- Purpose: <what this migration does>

-- Step 1: Add new tables/columns
CREATE TABLE IF NOT EXISTS new_table (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Your columns here
);

-- Step 2: Modify existing tables (if needed)
ALTER TABLE existing_table
  ADD COLUMN new_column VARCHAR(255);

-- Step 3: Add constraints
ALTER TABLE new_table
  ADD CONSTRAINT constraint_name
  CHECK (condition);

-- Step 4: Create indexes
CREATE INDEX IF NOT EXISTS index_name
ON new_table (column_name);

-- Step 5: Insert initial data (if needed)
INSERT INTO new_table (column1, column2)
VALUES ('value1', 'value2');

-- Step 6: Update functions/trigger (if needed)
```

## 🔄 **Executing Migrations**

### **Prerequisites**

Before executing migrations, you must link your local project to your Supabase project:

```bash
# Link your local project to Supabase
supabase link --project-ref your_project_id

# This will:
# 1. Connect your local project to your Supabase project
# 2. Set up the necessary configuration
# 3. Enable database operations

# Verify the link
supabase status
```

### **Local Development**

```bash
# Apply all pending migrations
supabase db push

# Apply specific migration
supabase db push --include-tags <migration-name>

# Check migration status
supabase migration list

# View migration history
supabase db history
```

### **Production Environment**

```bash
# For production, use the Supabase Dashboard
# 1. Go to your Supabase project
# 2. Navigate to SQL Editor
# 3. Copy and paste migration content
# 4. Execute the migration

# Or use Supabase CLI (if configured for production)
supabase db push --db-url "postgresql://..."
```

### **Supabase CLI vs Docker**

**Important**: Supabase CLI does NOT require Docker for database operations when linked to a remote Supabase project. Docker is only needed if you want to run a local Supabase instance.

```bash
# Remote project operations (no Docker needed)
supabase link --project-ref your_project_id
supabase db push

# Local development only (requires Docker)
supabase init
supabase start
```

## 📋 **Post-Migration Actions**

After executing a migration, perform these essential steps:

### **1. Generate Database Types**

```bash
# Regenerate TypeScript types to include new schema changes
pnpm run gen:types
```

### **2. Update Application Code**

#### **Update Type Definitions**

```typescript
// src/types/supabase.ts (auto-generated)
// Review the new types and ensure they match your expectations

// src/types/your-types.ts (if you have custom types)
export interface YourCustomType {
  // Update with new fields
  new_field: string
}
```

#### **Update Service Layer**

```typescript
// src/lib/supabase/services/your-service.ts
export class YourService extends BaseService {
  async getNewData() {
    const { data, error } = await this.client
      .from('new_table') // New table from migration
      .select('*')

    if (error) throw error
    return data
  }
}
```

#### **Update Components**

```typescript
// src/components/YourComponent.tsx
interface YourComponentProps {
  // Add new props if needed
  newData?: NewTableType
}
```

#### **Update Validation Schemas**

```typescript
// src/lib/validators/your-validator.ts
export const yourSchema = z.object({
  existing_field: z.string(),
  new_field: z.string().optional(), // New field from migration
})
```

### **3. Test the Changes**

```bash
# Run type checking to ensure no TypeScript errors
pnpm run type-check

# Run tests if you have them
pnpm test

# Start development server to test manually
pnpm dev
```

### **4. Update Documentation**

```markdown
# Update relevant README files

# Document new tables/columns

# Update API documentation
```

## 🛠️ **Common Migration Patterns**

### **Adding a New Table**

```sql
-- Create new table
CREATE TABLE IF NOT EXISTS posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS posts_user_id_idx ON posts(user_id);
CREATE INDEX IF NOT EXISTS posts_published_idx ON posts(published);

-- Add RLS policies
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own posts" ON posts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own posts" ON posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts" ON posts
  FOR DELETE USING (auth.uid() = user_id);
```

### **Adding a New Column**

```sql
-- Add new column to existing table
ALTER TABLE profiles
  ADD COLUMN bio TEXT;

-- Add constraint if needed
ALTER TABLE profiles
  ADD CONSTRAINT profiles_bio_length
  CHECK (bio IS NULL OR length(bio) <= 500);

-- Add index if frequently queried
CREATE INDEX IF NOT EXISTS profiles_bio_idx ON profiles(bio);
```

### **Modifying Constraints**

```sql
-- Drop existing constraint
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_status_check;

-- Add new constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_status_check
  CHECK (
    status IS NULL OR
    status = ANY (ARRAY['active'::text, 'inactive'::text, 'suspended'::text])
  );
```

### **Creating Enums**

```sql
-- Create enum type
CREATE TYPE user_role AS ENUM ('admin', 'user', 'moderator');

-- Add column with enum
ALTER TABLE profiles
  ADD COLUMN role user_role DEFAULT 'user';

-- Add constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IS NOT NULL);
```

## ⚠️ **Best Practices**

### **DO's**

- ✅ Use descriptive migration names
- ✅ Include comments explaining complex logic
- ✅ Use `IF NOT EXISTS` and `IF EXISTS` where appropriate
- ✅ Add proper constraints and indexes
- ✅ Enable Row Level Security (RLS) on user data
- ✅ Test migrations on staging first
- ✅ Keep migrations backward-compatible when possible

### **DON'Ts**

- ❌ Use hardcoded IDs or timestamps
- ❌ Forget to update types after migration
- ❌ Skip RLS policies on user data
- ❌ Use `SELECT *` in production code
- ❌ Forget to handle NULL values properly
- ❌ Mix multiple unrelated changes in one migration

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Migration Fails**

```bash
# Check migration status
supabase migration list

# Check if project is linked
supabase status

# Reset and retry (development only)
supabase db reset
```

#### **Project Not Linked**

```bash
# Error: "No linked project"
# Solution: Link your project first
supabase link --project-ref your_project_id

# Find your project ID in Supabase Dashboard > Project Settings > General
```

#### **Type Generation Fails**

```bash
# Check environment variables
echo $NEXT_PUBLIC_SUPABASE_PROJECT_ID

# Ensure Supabase CLI is installed
supabase --version

# Regenerate types manually
pnpm run gen:types
```

#### **Connection Issues**

```bash
# Check project status
supabase status

# Re-link if needed
supabase unlink
supabase link --project-ref your_project_id

# Verify database access
supabase db shell --command "SELECT 1;"
```

#### **RLS Policy Issues**

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

## 📚 **Related Documentation**

- **[Supabase Integration](../../src/lib/supabase/README.md)** - Database and auth layer
- **[Scripts Directory](../../scripts/README.md)** - Type generation scripts
- **[Project Structure](../../docs/structure.md)** - Overall project organization

---

**Always test migrations thoroughly and follow the post-migration checklist to ensure your application stays in sync with the database schema.**
