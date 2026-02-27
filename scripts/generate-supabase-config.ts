/**
 * @fileoverview Script to update Supabase config.toml when CLI version changes.
 *
 * This script compares the current Supabase CLI version with the version stored
 * in config.toml. If they differ, it generates a fresh config and patches it
 * with existing customizations (project_id, auth settings, etc.).
 *
 * @example
 * ```bash
 * # Check if config needs update
 * npx tsx scripts/generate-supabase-config.ts
 *
 * # Force update even if versions match
 * npx tsx scripts/generate-supabase-config.ts --force
 * ```
 *
 * @requires Supabase CLI to be installed
 *
 * @author YwyBase Team
 * @since 1.0.0
 * @todo: make it scallable
 */

import { execSync } from 'child_process'
import { existsSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { parseArgs } from 'util'
import { tmpdir } from 'os'

// Parse command line arguments
const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    force: { type: 'boolean', default: false, short: 'f' },
    check: { type: 'boolean', default: false, short: 'c' },
  },
  allowPositionals: true,
})

// Configuration
const CONFIG_PATH = join(process.cwd(), 'supabase', 'config.toml')
const CLI_VERSION_PATTERN = /^# CLI Version: (.+)$/m

/**
 * Custom settings that should be preserved when updating config.toml.
 * These are settings that differ from Supabase CLI defaults.
 */
interface CustomSettings {
  project_id: string
  auth_email_enable_confirmations: boolean
  auth_email_secure_password_change: boolean
  auth_email_max_frequency: string
}

/**
 * Gets the current Supabase CLI version.
 *
 * @returns {string} The CLI version string (e.g., "2.72.7")
 * @throws {Error} If Supabase CLI is not installed
 */
function getCliVersion(): string {
  try {
    const output = execSync('supabase --version', { encoding: 'utf-8', stdio: 'pipe' })
    return output.trim()
  } catch {
    console.error('❌ Error: Supabase CLI is not installed')
    console.error('   Install it with: brew install supabase/tap/supabase')
    process.exit(1)
  }
}

/**
 * Extracts the CLI version from the config.toml file.
 *
 * @param {string} configContent - The content of config.toml
 * @returns {string | null} The version string or null if not found
 */
function getConfigVersion(configContent: string): string | null {
  const match = configContent.match(CLI_VERSION_PATTERN)
  return match?.[1] ?? null
}

/**
 * Extracts custom settings from existing config.toml.
 *
 * @param {string} configContent - The content of config.toml
 * @returns {CustomSettings} The extracted custom settings
 */
function extractCustomSettings(configContent: string): CustomSettings {
  // Extract the [auth.email] section to scope matches correctly (avoids [auth.sms], [auth.mfa.phone], etc.)
  const authEmailSection = configContent.match(/\[auth\.email\][\s\S]*?(?=\n\[|$)/)?.[0] ?? ''

  // Extract project_id
  const projectIdMatch = configContent.match(/^project_id\s*=\s*"([^"]+)"/m)
  const project_id = projectIdMatch?.[1] ?? 'ywybase'

  // Extract auth.email settings
  const enableConfirmationsMatch = authEmailSection.match(/^\s*enable_confirmations\s*=\s*(true|false)/m)
  const auth_email_enable_confirmations = enableConfirmationsMatch?.[1] === 'true'

  const securePasswordChangeMatch = authEmailSection.match(/^\s*secure_password_change\s*=\s*(true|false)/m)
  const auth_email_secure_password_change = securePasswordChangeMatch?.[1] === 'true'

  const maxFrequencyMatch = authEmailSection.match(/^\s*max_frequency\s*=\s*"([^"]+)"/m)
  const auth_email_max_frequency = maxFrequencyMatch?.[1] ?? '1s' // CLI default is 1s

  return {
    project_id,
    auth_email_enable_confirmations,
    auth_email_secure_password_change,
    auth_email_max_frequency,
  }
}

/**
 * Generates a fresh config.toml using Supabase CLI.
 *
 * @returns {string} The generated config content
 */
function generateFreshConfig(): string {
  const tempDir = join(tmpdir(), `supabase-config-${Date.now()}`)

  try {
    // Create temp directory and initialize Supabase
    mkdirSync(tempDir, { recursive: true })
    execSync('supabase init --with-vscode-settings=false', {
      cwd: tempDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    })

    // Read the generated config
    const configPath = join(tempDir, 'supabase', 'config.toml')
    const config = readFileSync(configPath, 'utf-8')

    return config
  } finally {
    // Clean up temp directory
    try {
      rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Applies custom settings to a fresh config.
 *
 * @param {string} freshConfig - The freshly generated config
 * @param {CustomSettings} settings - The custom settings to apply
 * @param {string} cliVersion - The CLI version to embed
 * @returns {string} The patched config content
 */
function replaceAuthEmailSetting(
  section: string,
  key: 'enable_confirmations' | 'secure_password_change' | 'max_frequency',
  value: boolean | string,
  description: string,
  note: string
): string {
  const pattern = new RegExp(`(^\\s*)(?:#.*\\n)*\\s*${key}\\s*=.*`, 'm')
  const formattedValue = typeof value === 'boolean' ? `${key} = ${value}` : `${key} = "${value}"`
  return section.replace(pattern, (_, indent: string) => {
    return [`${indent}# ${description}`, `${indent}# NOTE: ${note}`, `${indent}${formattedValue}`].join('\n')
  })
}

function applyAuthEmailSettings(section: string, settings: CustomSettings): string {
  let updated = section

  updated = replaceAuthEmailSetting(
    updated,
    'enable_confirmations',
    settings.auth_email_enable_confirmations,
    'If enabled, users need to confirm their email address before signing in.',
    'Set to true for production - requires email verification before login'
  )

  updated = replaceAuthEmailSetting(
    updated,
    'secure_password_change',
    settings.auth_email_secure_password_change,
    'If enabled, users will need to reauthenticate or have logged in recently to change their password.',
    'Set to true for production - adds security for password changes'
  )

  updated = replaceAuthEmailSetting(
    updated,
    'max_frequency',
    settings.auth_email_max_frequency,
    'Controls the minimum amount of time that must pass before sending another signup confirmation or password reset email.',
    'Set to 10s for production to prevent email spam'
  )

  return updated
}

function applyCustomSettings(freshConfig: string, settings: CustomSettings, cliVersion: string): string {
  let config = freshConfig

  // Add CLI version comment at the top
  const headerComment = `# CLI Version: ${cliVersion}\n`
  if (config.startsWith('#')) {
    config = headerComment + config
  } else {
    config = headerComment + '\n' + config
  }

  // Replace project_id
  config = config.replace(/^project_id\s*=\s*"[^"]+"/m, `project_id = "${settings.project_id}"`)

  // Scope auth.email customizations to the [auth.email] section only
  const authEmailSectionMatch = config.match(/\[auth\.email\][\s\S]*?(?=\n\[|$)/)
  if (authEmailSectionMatch) {
    const originalSection = authEmailSectionMatch[0]
    const updatedSection = applyAuthEmailSettings(originalSection, settings)
    config = config.replace(originalSection, updatedSection)
  }

  return config
}

/**
 * Main function to update Supabase config.toml.
 */
async function main(): Promise<void> {
  console.log('🔧 Supabase Config Updater')
  console.log('')

  // Check if config.toml exists
  if (!existsSync(CONFIG_PATH)) {
    console.error('❌ Error: supabase/config.toml not found')
    console.error('   Run `supabase init` to create it')
    process.exit(1)
  }

  // Get current CLI version
  const cliVersion = getCliVersion()
  console.log(`📦 CLI Version: ${cliVersion}`)

  // Read existing config
  const existingConfig = readFileSync(CONFIG_PATH, 'utf-8')
  const configVersion = getConfigVersion(existingConfig)

  if (configVersion) {
    console.log(`📄 Config Version: ${configVersion}`)
  } else {
    console.log(`📄 Config Version: not tracked`)
  }
  console.log('')

  // Check if update is needed
  const needsUpdate = args.values.force ?? configVersion !== cliVersion

  if (!needsUpdate) {
    console.log('✅ Config is up to date!')
    process.exit(0)
  }

  // If --check flag, just report status
  if (args.values.check) {
    console.log('⚠️  Config needs update')
    console.log(`   Current: ${configVersion ?? 'unknown'}`)
    console.log(`   CLI:     ${cliVersion}`)
    process.exit(1) // Exit with error code to indicate update needed
  }

  console.log('🔄 Updating config.toml...')
  console.log('')

  // Extract custom settings from existing config
  const customSettings = extractCustomSettings(existingConfig)
  console.log('📋 Preserving custom settings:')
  console.log(`   project_id: ${customSettings.project_id}`)
  console.log(`   auth.email.enable_confirmations: ${customSettings.auth_email_enable_confirmations}`)
  console.log(`   auth.email.secure_password_change: ${customSettings.auth_email_secure_password_change}`)
  console.log(`   auth.email.max_frequency: ${customSettings.auth_email_max_frequency}`)
  console.log('')

  // Generate fresh config
  console.log('🚀 Generating fresh config from CLI...')
  const freshConfig = generateFreshConfig()

  // Apply custom settings
  const patchedConfig = applyCustomSettings(freshConfig, customSettings, cliVersion)

  // Write updated config
  writeFileSync(CONFIG_PATH, patchedConfig, 'utf-8')

  console.log('')
  console.log('✅ Config updated successfully!')
  console.log('')
  console.log('📋 Next steps:')
  console.log('   1. Review changes: git diff supabase/config.toml')
  console.log('   2. Commit if satisfied: git add supabase/config.toml')
  console.log('')
}

// Run the script
main().catch((error) => {
  console.error('')
  console.error('❌ Error:', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
