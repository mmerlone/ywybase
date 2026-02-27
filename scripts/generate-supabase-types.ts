/**
 * @fileoverview Script to generate TypeScript types from Supabase database schema.
 *
 * This script connects to your Supabase project, fetches the database schema,
 * and generates TypeScript types that match your database structure. This provides
 * full type safety when working with Supabase queries and operations.
 *
 * @example
 * ```bash
 * # Run the script
 * pnpm run gen:types
 *
 * # Or run directly
 * npx ts-node scripts/generate-supabase-types.ts
 * ```
 *
 * @requires NEXT_PUBLIC_SUPABASE_PROJECT_ID or SUPABASE_PROJECT_ID in .env.local
 * @requires Supabase CLI to be installed globally
 *
 * @author YwyBase Team
 * @since 1.0.0
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

// Load environment variables from .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

// Configuration
const SUPABASE_PROJECT_ID = process.env.NEXT_PUBLIC_SUPABASE_PROJECT_ID ?? process.env.SUPABASE_PROJECT_ID
const OUTPUT_FILE = join(process.cwd(), 'src/types/supabase.ts')

if (!SUPABASE_PROJECT_ID) {
  console.error('❌ Error: SUPABASE_PROJECT_ID is not defined in .env.local')
  process.exit(1)
}

/**
 * Generates TypeScript types from Supabase database schema.
 *
 * This function:
 * 1. Validates that Supabase CLI is installed
 * 2. Connects to your Supabase project using the project ID
 * 3. Fetches the database schema for the 'public' schema
 * 4. Generates TypeScript types matching the database structure
 * 5. Writes the types to src/types/supabase.ts
 *
 * @async
 * @function generateTypes
 * @returns {Promise<void>} Promise that resolves when types are generated
 * @throws {Error} If Supabase CLI is not installed or project ID is missing
 *
 * @example
 * ```typescript
 * await generateTypes();
 * console.log('Types generated successfully!');
 * ```
 */
async function generateTypes(): Promise<void> {
  console.log('🔍 Generating Supabase types...')

  try {
    // Check if supabase CLI is installed
    try {
      execSync('supabase --version', { stdio: 'pipe' })
    } catch {
      console.error('❌ Supabase CLI is not installed. Please install it with:')
      console.log('   npm install -g supabase')
      process.exit(1)
    }

    // Generate types using Supabase CLI
    console.log('🚀 Fetching schema from Supabase...')
    const types = execSync(`supabase gen types typescript --project-id ${SUPABASE_PROJECT_ID} --schema public`, {
      stdio: 'pipe',
    }).toString()

    // Add a header to the generated types
    const header = `/**
   * Auto-generated file - DO NOT EDIT
   *
   * Generated: ${new Date().toISOString()}
   * Project ID: ${SUPABASE_PROJECT_ID}
   *
   * To regenerate these types, run:
   *   pnpm run gen:types
   *
   * For more information about Supabase types, see:
   *   https://supabase.com/docs/guides/database/api/generating-types
   */

  `

    // Write the types to file
    writeFileSync(OUTPUT_FILE, header + types, 'utf8')

    console.log(`✅ Types generated successfully at: ${OUTPUT_FILE}`)
  } catch (error) {
    console.error('❌ Failed to generate Supabase types:')
    if (error instanceof Error) {
      console.error(error.message)
      if (error.message.includes('ENOENT')) {
        console.log('\nMake sure Supabase CLI is installed and configured correctly.')
      }
    }
    process.exit(1)
  }
}

generateTypes().catch(() => {
  // Already logged
})
