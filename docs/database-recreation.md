# Database Recreation Guide

The database is managed entirely through Supabase migrations.

## 🚨 Important Warnings

- **Resets drop all data**. Always create a backup first.
- **Stop application traffic** during the maintenance window.
- **Never store database passwords in scripts**. Use your `.env.local` file.

## 📋 Prerequisites

1. Valid Supabase credentials in `.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_PROJECT_ID=your_project_id
   SUPABASE_DB_PASSWORD=your_database_password
   ```

2. Supabase CLI installed (globally or via `npx`)
3. `psql` available if you plan to replay dumps manually

## 🔐 Build a Database URL

```bash
export SUPABASE_DB_URL="postgresql://postgres:${SUPABASE_DB_PASSWORD}@db.${SUPABASE_PROJECT_ID}.supabase.co:5432/postgres"
```

> The CLI needs a full connection string to operate against the hosted database.

## 💾 Optional: Create a Backup

```bash
mkdir -p backups
npx supabase db dump --schema public --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_schema.sql

# Include data if required
npx supabase db dump --db-url "$SUPABASE_DB_URL" > backups/$(date +%Y%m%d%H%M%S)_full.sql
```

Store backups securely (Git-ignored) and verify their contents.

## 🧹 Reset the Database

```bash
# Danger: this drops every table
npx supabase db reset --db-url "$SUPABASE_DB_URL"
```

If your Supabase plan does not allow CLI resets, use the Supabase dashboard → Database Settings → **Reset Database**.

## 🏗️ Reapply the Schema

```bash
# Re-run all migrations against the clean database (also regenerates Supabase types)
pnpm run db:init
```

The migrations directory (`supabase/migrations`) is now the single source of truth for the database structure.

## 🔍 Verify the Setup

```bash
pnpm run db:init --status   # Should show no pending migrations
psql "$SUPABASE_DB_URL" -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';"
pnpm run dev
```

Test authentication flows, profile updates, and any feature that depends on the database.

## ♻️ Restoring from a Dump (Rare)

Prefer rebuilding via migrations. If you must replay a SQL dump, run:

```bash
psql "$SUPABASE_DB_URL" < backups/20250101000000_full.sql
pnpm run db:init --status
pnpm run gen:types
```

## 📚 References

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Workflow](../scripts/README.md)
- [Supabase Dashboard → Database Settings](https://supabase.com/dashboard)

---

Keep your migrations up to date and the database can always be recreated safely from source control.
