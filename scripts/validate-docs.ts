#!/usr/bin/env tsx

/**
 * Documentation Validation Script
 *
 * This script validates the documentation for:
 * - Broken internal links
 * - Missing referenced files
 * - Consistent formatting
 * - Required sections presence
 */

import { readFileSync, existsSync } from 'fs'
import { join, relative, dirname } from 'path'
import { glob } from 'glob'

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

interface ValidationError {
  type: 'broken_link' | 'missing_file' | 'missing_section'
  file: string
  line?: number
  message: string
}

interface ValidationWarning {
  type: 'formatting' | 'outdated'
  file: string
  line?: number
  message: string
}

class DocumentationValidator {
  private docsDir: string
  private projectRoot: string
  private results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
  }

  constructor(docsDir: string = './docs') {
    this.docsDir = docsDir
    this.projectRoot = '.'
  }

  async validate(): Promise<ValidationResult> {
    console.log('🔍 Validating documentation...')

    // Find all markdown files
    const markdownFiles = await glob('**/*.md', {
      cwd: this.docsDir,
      absolute: true,
    })

    console.log(`📄 Found ${markdownFiles.length} markdown files`)

    // Validate each file
    for (const file of markdownFiles) {
      await this.validateFile(file)
    }

    // Check for missing referenced files
    await this.validateReferencedFiles()

    // Print results
    this.printResults()

    return this.results
  }

  private async validateFile(filePath: string): Promise<void> {
    const content = readFileSync(filePath, 'utf-8')
    const lines = content.split('\n')
    const relativePath = relative(this.projectRoot, filePath)

    // Check for required sections
    this.validateRequiredSections(relativePath, content)

    // Check internal links
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line === undefined) continue
      const lineNumber = i + 1

      // Find markdown links
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
      let match

      while ((match = linkRegex.exec(line)) !== null && match !== null) {
        const [, , linkUrl] = match

        // Skip external links and anchors
        if (linkUrl && (linkUrl.startsWith('http') || linkUrl.startsWith('#'))) {
          continue
        }

        if (linkUrl) {
          // Validate internal link
          this.validateInternalLink(relativePath, linkUrl, lineNumber)
        }
      }
    }

    // Check formatting consistency
    this.validateFormatting(relativePath, content)
  }

  private validateRequiredSections(filePath: string, content: string): void {
    const requiredSections = [
      { pattern: /^# /, message: 'Missing main title' },
      { pattern: /## /, message: 'Missing section headers' },
      { pattern: /\*\*Last Updated\*\*:/, message: 'Missing Last Updated footer' },
    ]

    for (const { pattern, message } of requiredSections) {
      if (!pattern.test(content)) {
        this.results.errors.push({
          type: 'missing_section',
          file: filePath,
          message,
        })
        this.results.valid = false
      }
    }
  }

  private validateInternalLink(sourceFile: string, linkUrl: string, lineNumber: number): void {
    // Resolve the link path
    let targetPath: string

    if (linkUrl.startsWith('./')) {
      // Relative link
      targetPath = join(dirname(sourceFile), linkUrl)
    } else if (linkUrl.startsWith('/')) {
      // Absolute link from project root
      targetPath = join(this.projectRoot, linkUrl.slice(1))
    } else {
      // Relative to docs directory
      targetPath = join(this.docsDir, linkUrl)
    }

    // Remove anchor if present
    const anchorIndex = targetPath.indexOf('#')
    if (anchorIndex !== -1) {
      targetPath = targetPath.slice(0, anchorIndex)
    }

    // Check if file exists
    if (!existsSync(targetPath)) {
      this.results.errors.push({
        type: 'broken_link',
        file: sourceFile,
        line: lineNumber,
        message: `Broken link: ${linkUrl} -> ${targetPath} (file not found)`,
      })
      this.results.valid = false
    }
  }

  private validateFormatting(filePath: string, content: string): void {
    const lines = content.split('\n')

    // Check for consistent heading spacing
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (line === undefined) continue

      // Headings should have proper spacing
      if (line.startsWith('#')) {
        const headingMatch = line.match(/^(#+)\s*(.+)$/)
        if (headingMatch) {
          const [, hashes] = headingMatch

          // Check for multiple spaces after #
          if (hashes && hashes + '  ' === line.slice(0, hashes.length + 2)) {
            this.results.warnings.push({
              type: 'formatting',
              file: filePath,
              line: i + 1,
              message: 'Multiple spaces after heading marker',
            })
          }
        }
      }
    }

    // Check for trailing whitespace
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i]
      if (l?.endsWith(' ')) {
        this.results.warnings.push({
          type: 'formatting',
          file: filePath,
          line: i + 1,
          message: 'Trailing whitespace',
        })
      }
    }
  }

  private async validateReferencedFiles(): Promise<void> {
    // Check for commonly referenced files that should exist
    const expectedFiles = [
      'README.md',
      'docs/architecture.md',
      'docs/structure.md',
      'docs/security.md',
      'docs/getting-started/setup.md',
      'docs/user-guides/server-actions.md',
      'docs/user-guides/api-reference.md',
      'docs/developer-guides/api-development.md',
    ]

    for (const file of expectedFiles) {
      if (!existsSync(file)) {
        this.results.errors.push({
          type: 'missing_file',
          file: file,
          message: `Expected file not found: ${file}`,
        })
        this.results.valid = false
      }
    }
  }

  private printResults(): void {
    console.log('\n📊 Validation Results:')
    console.log('========================\n')

    if (this.results.errors.length === 0 && this.results.warnings.length === 0) {
      console.log('✅ All documentation passed validation!')
    } else {
      if (this.results.errors.length > 0) {
        console.log(`❌ ${this.results.errors.length} Errors found:`)
        console.log('')

        for (const error of this.results.errors) {
          console.log(`  📁 ${error.file}`)
          if (error.line) {
            console.log(`  📍 Line ${error.line}: ${error.message}`)
          } else {
            console.log(`  ❌ ${error.message}`)
          }
          console.log('')
        }
      }

      if (this.results.warnings.length > 0) {
        console.log(`⚠️  ${this.results.warnings.length} Warnings:`)
        console.log('')

        for (const warning of this.results.warnings) {
          console.log(`  📁 ${warning.file}`)
          if (warning.line) {
            console.log(`  📍 Line ${warning.line}: ${warning.message}`)
          } else {
            console.log(`  ⚠️  ${warning.message}`)
          }
          console.log('')
        }
      }
    }

    console.log(`📈 Summary:`)
    console.log(`  - Errors: ${this.results.errors.length}`)
    console.log(`  - Warnings: ${this.results.warnings.length}`)
    console.log(`  - Status: ${this.results.valid ? '✅ PASSED' : '❌ FAILED'}`)
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const validator = new DocumentationValidator()

  validator
    .validate()
    .then((result) => {
      process.exit(result.valid ? 0 : 1)
    })
    .catch((error) => {
      console.error('❌ Validation failed with error:', error)
      process.exit(1)
    })
}

export type { ValidationResult }
export { DocumentationValidator }
