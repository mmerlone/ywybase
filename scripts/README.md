# Scripts Directory

Development and build scripts for the YwyBase project.

## 📁 **Available Scripts**

### **🔧 Type Generation Scripts**

#### **generate-supabase-types.ts**

Generates TypeScript types from your Supabase database schema.

```bash
pnpm run gen:types
```

#### **generate-supabase-config.ts**

Updates `supabase/config.toml` when the Supabase CLI version changes.

```bash
# Check if config needs update
pnpm exec tsx scripts/generate-supabase-config.ts

# Force update even if versions match
pnpm exec tsx scripts/generate-supabase-config.ts --force

# Check only (exit code 1 if update needed)
pnpm exec tsx scripts/generate-supabase-config.ts --check
```

**What it does:**

- Compares CLI version with version stored in `config.toml`
- Generates fresh config from current CLI if versions differ
- Preserves project-specific customizations (project_id, auth settings)
- Adds `# CLI Version: x.x.x` header for tracking

**Preserved Settings:**

- `project_id` - Your project identifier
- `auth.email.enable_confirmations` - Email verification requirement
- `auth.email.secure_password_change` - Password change security
- `auth.email.max_frequency` - Email rate limiting

### **💾 Database Management Scripts**

#### **init-database.ts**

Applies Supabase migrations to your remote project using the Supabase CLI.

```bash
# Apply all pending migrations
pnpm run db:init

# Check migration status
pnpm run db:init --status
```

**What it does:**

- Validates environment variables
- Ensures the `supabase/migrations` directory exists
- Delegates to the Supabase CLI for database push and migration status commands
- Provides helpful messaging for resets and linking new migrations

**Advanced Operations:**

Backup, restore, and wipe functionality now rely on the Supabase CLI or dashboard directly. Recommended commands:

```bash
# Build a reusable DB URL
export SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"

# Schema-only backup
pnpm exec supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_schema.sql

# Full backup
pnpm exec supabase db dump --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_full.sql

# Reset database (DANGER)
- Valid schema backup file in backups/ directory
pnpm run db:init   # Automatically regenerates Supabase types

# Manual restore
psql "$SUPABASE_DB_URL" < backups/20250101000000_full.sql
```

Refer to the [Supabase CLI docs](https://supabase.com/docs/guides/cli) for option details and additional workflows.

### **PostgreSQL Version Compatibility**

⚠️ **Important**: Your pg_dump version must match your Supabase PostgreSQL server version.

```bash
# Check your pg_dump version
pg_dump --version

# Check your Supabase server version in Dashboard > Settings > Database

# If versions do not match, use a compatible PostgreSQL client or the Supabase
# Dashboard SQL editor for the backup.
```

**Backup Organization:**

```
backups/
├── your_project_id_schema_backup_2025-01-15T10-30-00-000Z.sql
├── your_project_id_schema_backup_2025-01-15T10-30-00-000Z_summary.json
├── your_project_id_full_backup_2025-01-15T10-30-00-000Z.sql
└── your_project_id_full_backup_2025-01-15T10-30-00-000Z_summary.json
```

**Backup Types:**

- **Schema Only**: Database structure, tables, constraints, indexes
- **Full with Data**: Complete database including all data

**Restoring Backups:**

```bash
# Using psql
psql "postgresql://user:pass@host:port/dbname" < backup_file.sql

# Using Supabase CLI
supabase db shell
\i backup_file.sql
```

## 🛠️ **Development Workflow**

### **Initial Setup**

1. **Generate Supabase Types**

   ```bash
   pnpm run gen:types
   ```

### **During Development**

1. **Regenerate Supabase Types** (after schema changes)

   ```bash
   # Terminal 2 (run as needed)
   pnpm run gen:types
   ```

2. **Database Maintenance**

> Use the Supabase CLI directly for backups, restores, and resets.

```bash
export SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"

# Schema backup
pnpm exec supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_schema.sql

# Full backup
pnpm exec supabase db dump --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_full.sql

# Reset database (DANGER)
pnpm exec supabase db reset --db-url "$SUPABASE_DB_URL"
pnpm run db:init   # Automatically regenerates Supabase types
```

### **Before Commit**

```bash
# Ensure all types are up to date
pnpm run gen:types
pnpm run type-check

# Optional: Create a schema backup before major changes
pnpm exec supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_schema.sql
```

## 📋 **Environment Requirements**

### **Supabase Type Generation**

```bash
# Required environment variables
NEXT_PUBLIC_SUPABASE_PROJECT_ID=your_project_id

# Required tools
pnpm exec supabase --version
```

### **Database Backups / Resets**

```bash
# Required environment variables
SUPABASE_PROJECT_ID=your_project_id
SUPABASE_DB_PASSWORD=your_database_password

# Build a DB URL
echo "postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"

# Required tools
pnpm exec supabase --version
psql --version          # Needed only for manual restore commands
```

## 🔧 **Adding New Scripts**

### **Script Template**

````typescript
/**
 * @fileoverview Brief description of what the script does.
 *
 * Detailed description of the script's purpose and functionality.
 *
 * @example
 * ```bash
 * # Run the script
 * pnpm run script-name
 * ```
 *
 * @author YwyBase Team
 * @since 1.0.0
 */

import {} from /* your imports */ 'your-dependencies'

/**
 * Main function that performs the script's primary task.
 *
 * @async
 * @function mainFunction
 * @returns {Promise<void>} Promise that resolves when complete
 * @throws {Error} If something goes wrong
 *
 * @example
 * ```typescript
 * await mainFunction();
 * console.log('Script completed successfully!');
 * ```
 */
async function mainFunction(): Promise<void> {
  try {
    // Your implementation here
    console.log('✅ Script completed successfully')
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  }
}

// Run the script
mainFunction().catch(console.error)
````

### **Adding to package.json**

```json
{
  "scripts": {
    "script-name": "pnpm exec tsx scripts/your-script.ts"
  }
}
```

## 🚀 **Best Practices**

### **Error Handling**

- Always include proper error handling
- Use clear console messages with emojis
- Exit with error code on failure

### **Type Safety**

- Use TypeScript for all scripts
- Include proper JSDoc documentation
- Use environment variables with validation

### **File Operations**

- Check if files exist before reading
- Create directories if they don't exist
- Use proper file permissions

### **Process Management**

- Handle process cleanup properly
- Use appropriate exit codes
- Provide clear feedback to users

## 🔗 **Related Documentation**

- **[Project Structure](../docs/structure.md)** - Overall project organization
- **[Main README](../README.md)** - Project overview and setup
- **[Type Safety](../src/types/README.md)** - Type system documentation

---

**All scripts are designed to be run independently or as part of the development workflow.**
