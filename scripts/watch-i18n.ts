/**
 * @fileoverview Script to watch for changes in i18n translation files and auto-regenerate types.
 *
 * This script monitors your translation files for changes and automatically
 * regenerates the TypeScript types whenever a file is modified, added, or deleted.
 * This provides a seamless development experience when working with translations.
 *
 * @example
 * ```bash
 * # Run the watcher
 * pnpm run watch:i18n
 *
 * # Or run directly
 * npx ts-node scripts/watch-i18n.ts
 * ```
 *
 * @requires generate:i18n-types script to be available
 * @uses chokidar for file watching
 *
 * @author YwyBase Team
 * @since 1.0.0
 */

import { spawn } from 'child_process'
import { watch } from 'chokidar'

// Watch for changes in all JSON files in the locales directory
const watcher = watch(['src/locales/**/*.json'], {
  persistent: true,
  ignoreInitial: true,
})

let buildProcess: ReturnType<typeof spawn> | null = null

/**
 * Handles file system events by triggering type regeneration.
 *
 * This function:
 * 1. Kills any existing build process to prevent conflicts
 * 2. Spawns a new process to regenerate i18n types
 * 3. Logs the detected change for debugging
 *
 * @param {string} event - The type of file system event (add, change, unlink)
 * @param {string} path - The path to the file that changed
 *
 * @example
 * ```typescript
 * // This would be triggered automatically by chokidar
 * handleFileChange('change', 'src/locales/en/common.json');
 * ```
 */
function handleFileChange(event: string, path: string): void {
  console.log(`\n📝 Detected ${event} in ${path}, regenerating types...`)

  if (buildProcess) {
    buildProcess.kill()
  }

  buildProcess = spawn('npm', ['run', 'generate:i18n-types'], {
    stdio: 'inherit',
    shell: true,
  })
}

// Set up the file watcher
watcher.on('all', handleFileChange)

console.log('👀 Watching for translation changes...')
console.log('💡 Make changes to any JSON file in src/locales/ to auto-regenerate types')
console.log('⚠️  Press Ctrl+C to stop watching')
