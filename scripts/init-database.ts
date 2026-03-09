/**
 * @fileoverview Script to initialize Supabase database using migrations.
 *
 * This script uses Supabase CLI to apply migrations to your remote database.
 * It's the recommended way to manage database schema with Supabase.
 *
 * @example
 * ```bash
 * # Apply all pending migrations
 * pnpm run db:init
 *
 * # Check migration status
 * pnpm run db:init --status
 *
 * # Reset database and reapply all migrations (DANGER!)
 * pnpm run db:init --reset
 * ```
 *
 * @requires NEXT_PUBLIC_SUPABASE_URL in .env.local
 * @requires SUPABASE_PROJECT_ID in .env.local
 * @requires SUPABASE_DB_PASSWORD in .env.local
 * @requires Supabase CLI (installed via npx)
 *
 * @author YwyBase Team
 * @since 1.0.0
 */

import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Parse command line arguments
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    status: { type: 'boolean', default: false },
    reset: { type: 'boolean', default: false },
  },
  allowPositionals: true,
})

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const PROJECT_ID = process.env.SUPABASE_PROJECT_ID ?? process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID
const DB_PASSWORD = process.env.SUPABASE_DB_PASSWORD

// Validate required environment variables
if (!SUPABASE_URL) {
  console.error('❌ Error: NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  process.exit(1)
}

if (!PROJECT_ID) {
  console.error('❌ Error: SUPABASE_PROJECT_ID is not set in .env.local')
  process.exit(1)
}

if (!DB_PASSWORD) {
  console.error('❌ Error: SUPABASE_DB_PASSWORD is not set in .env.local')
  process.exit(1)
}

// Check if supabase directory exists
const supabasePath = join(process.cwd(), 'supabase')
if (!existsSync(supabasePath)) {
  console.error('❌ Error: supabase/ directory not found')
  console.error('')
  console.error('   Initialize Supabase in your project:')
  console.error('   npx supabase init')
  console.error('')
  process.exit(1)
}

// Check if migrations directory exists
const migrationsPath = join(supabasePath, 'migrations')
if (!existsSync(migrationsPath)) {
  console.error('❌ Error: supabase/migrations/ directory not found')
  console.error('')
  console.error('   Create your first migration:')
  console.error('   npx supabase migration new initial_schema')
  console.error('')
  process.exit(1)
}

console.log('🚀 Supabase Database Migration Tool')
console.log(`   Project ID: ${PROJECT_ID}`)
console.log(`   Migrations: ${migrationsPath}`)
console.log('')

// Set database password as environment variable for Supabase CLI
process.env.DB_PASSWORD = DB_PASSWORD

try {
  // Check Supabase CLI availability
  console.log('🔍 Checking Supabase CLI...')
  try {
    execSync('npx supabase --version', { encoding: 'utf-8', stdio: 'pipe' })
    console.log('✅ Supabase CLI available')
  } catch {
    console.error('❌ Error: Supabase CLI not available')
    console.error('   Install it globally: npm install -g supabase')
    console.error('   Or use via npx (automatic)')
    process.exit(1)
  }

  // Handle --status flag
  if (args.values.status) {
    console.log('')
    console.log('📊 Checking migration status...')
    console.log('')

    const statusCommand = `npx supabase migration list --db-url "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"`

    execSync(statusCommand, {
      stdio: 'inherit',
      encoding: 'utf-8',
    })

    process.exit(0)
  }

  // Handle --reset flag
  if (args.values.reset) {
    console.log('⚠️  WARNING: Database reset requested!')
    console.log('   This will DROP all tables and reapply migrations.')
    console.log('   ALL DATA WILL BE LOST!')
    console.log('')
    console.log('   To confirm, run:')
    console.log(
      `   npx supabase db reset --db-url "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"`
    )
    console.log('')
    process.exit(1)
  }

  // Apply migrations
  console.log('📝 Applying migrations to remote database...')
  console.log('')

  const pushCommand = `npx supabase db push --db-url "postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_ID}.supabase.co:5432/postgres"`

  execSync(pushCommand, {
    stdio: 'inherit',
    encoding: 'utf-8',
  })

  console.log('')
  console.log('✅ Database migrations completed successfully!')
  console.log('')
  console.log('🧬 Regenerating Supabase types...')

  execSync('pnpm run gen:types', {
    stdio: 'inherit',
    encoding: 'utf-8',
  })

  console.log('')
  console.log('✅ Supabase types are up to date!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Check migration status: pnpm run db:init --status')
  console.log('   2. Create new migration: npx supabase migration new <name>')
  console.log('')
} catch (error) {
  console.error('')
  console.error('❌ Error during database migration:')
  console.error(error instanceof Error ? error.message : String(error))
  console.error('')
  console.error('💡 Troubleshooting:')
  console.error('   - Verify SUPABASE_DB_PASSWORD in .env.local')
  console.error('   - Check database connectivity from Supabase Dashboard')
  console.error('   - Ensure migrations are valid SQL')
  console.error('   - Review migration files in supabase/migrations/')
  console.error('')
  console.error('💡 Useful commands:')
  console.error('   - Check status: pnpm run db:init --status')
  console.error('   - Create migration: npx supabase migration new <name>')
  console.error('   - Pull remote schema: npx supabase db pull')
  console.error('')
  process.exit(1)
}
