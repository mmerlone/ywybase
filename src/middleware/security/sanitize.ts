/**
 * Input Sanitization Utilities
 *
 * Comprehensive input sanitization to prevent XSS, injection attacks,
 * and other security vulnerabilities. Uses configuration from
 * src/config/security.ts for validation rules.
 */

import { load } from 'cheerio'
import type { AnyNode, Element } from 'domhandler'

import { SECURITY_CONFIG } from '@/config/security'
import { buildLogger } from '@/lib/logger/client'
import { safeJsonParse } from '@/lib/utils/json'
import type {
  HtmlSanitizeOptions,
  InputSanitizeOptions,
  FileValidationOptions,
  FileValidationResult,
  FileMetadata,
  SanitizationReport,
} from '@/types/security.types'

const logger = buildLogger('security-sanitize')
const DISALLOWED_CONTENT_TAGS = new Set([
  'base',
  'embed',
  'form',
  'iframe',
  'link',
  'listing',
  'math',
  'meta',
  'noembed',
  'noscript',
  'object',
  'option',
  'plaintext',
  'script',
  'style',
  'svg',
  'textarea',
  'xmp',
])
const SELF_CLOSING_TAGS = new Set(['br'])
const DANGEROUS_PROTOCOL_PREFIXES = ['data:', 'javascript:', 'vbscript:']
const SAFE_LINK_PROTOCOLS = new Set(['http:', 'https:', 'mailto:'])

interface SanitizerConfig {
  allowedAttributes: Set<string>
  allowedTags: Set<string>
}

/**
 * Escape HTML entities to prevent XSS
 */
export function escapeHtml(input: string): string {
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return input.replace(/[&<>"'`=/]/g, (char) => entityMap[char] ?? char)
}

function isTextNode(node: AnyNode): node is AnyNode & { data: string } {
  return 'data' in node && typeof node.data === 'string' && node.type === 'text'
}

function isElementNode(node: AnyNode): node is AnyNode & Element {
  return 'name' in node && typeof node.name === 'string' && 'attribs' in node && node.attribs !== null
}

function isSafeHref(value: string): boolean {
  const trimmedValue = value.trim()
  const lowercaseValue = trimmedValue.toLowerCase()
  if (
    !trimmedValue ||
    trimmedValue.startsWith('//') ||
    DANGEROUS_PROTOCOL_PREFIXES.some((prefix) => lowercaseValue.startsWith(prefix))
  ) {
    return false
  }

  if (
    trimmedValue.startsWith('#') ||
    trimmedValue.startsWith('/') ||
    trimmedValue.startsWith('./') ||
    trimmedValue.startsWith('../') ||
    trimmedValue.startsWith('?')
  ) {
    return true
  }

  try {
    const parsed = new URL(trimmedValue, 'https://example.com')
    const hasExplicitProtocol = /^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmedValue)
    return !hasExplicitProtocol || SAFE_LINK_PROTOCOLS.has(parsed.protocol.toLowerCase())
  } catch {
    return false
  }
}

function sanitizeAttributes(node: Element, config: SanitizerConfig): string {
  return Object.entries(node.attribs)
    .flatMap(([name, value]) => {
      const attributeName = name.toLowerCase()
      if (attributeName.startsWith('on') || attributeName === 'style' || !config.allowedAttributes.has(attributeName)) {
        return []
      }

      if (attributeName === 'href' && !isSafeHref(value)) {
        return []
      }

      return [` ${attributeName}="${escapeHtml(value)}"`]
    })
    .join('')
}

function sanitizeNode(node: AnyNode, config: SanitizerConfig): string {
  if (isTextNode(node)) {
    return escapeHtml(node.data)
  }

  if (!isElementNode(node)) {
    return ''
  }

  const tagName = node.name.toLowerCase()
  if (!config.allowedTags.has(tagName)) {
    return DISALLOWED_CONTENT_TAGS.has(tagName)
      ? ''
      : node.children.map((childNode) => sanitizeNode(childNode, config)).join('')
  }

  const attributes = sanitizeAttributes(node, config)
  const children = node.children.map((childNode) => sanitizeNode(childNode, config)).join('')
  const openTag = `<${tagName}${attributes}>`

  if (SELF_CLOSING_TAGS.has(tagName)) {
    return openTag
  }

  return `${openTag}${children}</${tagName}>`
}

function sanitizeNodes(nodes: AnyNode[], config: SanitizerConfig): string {
  return nodes.map((node) => sanitizeNode(node, config)).join('')
}

function sanitizeHtmlFragment(input: string, config: SanitizerConfig): string {
  // Parse as an HTML fragment so we preserve only the provided markup, not an injected document shell.
  const $ = load(input, undefined, false)
  return sanitizeNodes($.root().contents().toArray(), config)
}

function sanitizeToPlainText(input: string): string {
  return sanitizeHtmlFragment(input, {
    allowedTags: new Set(),
    allowedAttributes: new Set(),
  })
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string, options: HtmlSanitizeOptions = {}): string {
  try {
    const {
      allowedTags = ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li'],
      allowedAttributes = ['href', 'title'],
      stripTags = false,
      allowLinks = false,
    } = options

    if (stripTags) {
      return sanitizeToPlainText(input)
    }

    const config: SanitizerConfig = {
      allowedTags: new Set(allowLinks ? [...allowedTags, 'a'] : allowedTags),
      allowedAttributes: new Set(allowedAttributes),
    }
    const sanitized = sanitizeHtmlFragment(input, config)

    logger.debug(
      {
        inputLength: input.length,
        outputLength: sanitized.length,
        allowedTags: allowedTags.length,
        stripped: input.length !== sanitized.length,
      },
      'HTML sanitized'
    )

    return sanitized
  } catch (err) {
    logger.error({ err, inputLength: input.length }, 'Error sanitizing HTML')
    // Return empty string on error for security
    return ''
  }
}

/**
 * Sanitize general text input
 */
export function sanitizeInput(input: string, options: InputSanitizeOptions = {}): string {
  try {
    const {
      maxLength = SECURITY_CONFIG.validation.strings.maxLength,
      allowHtml = false,
      trimWhitespace = true,
      removeControlChars = true,
    } = options

    let sanitized = input

    // Trim whitespace
    if (trimWhitespace) {
      sanitized = sanitized.trim()
    }

    // Remove control characters (except newlines and tabs)
    if (removeControlChars) {
      sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    }

    // Enforce length limit before escaping to avoid breaking entities
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength)
      logger.warn(
        {
          originalLength: input.length,
          truncatedLength: sanitized.length,
          maxLength,
        },
        'Input truncated due to length limit'
      )
    }

    // Handle HTML content
    if (allowHtml) {
      sanitized = sanitizeHtml(sanitized)
    } else {
      sanitized = escapeHtml(sanitized)
    }

    return sanitized
  } catch (err) {
    logger.error({ err, inputLength: input.length }, 'Error sanitizing input')
    return ''
  }
}

/**
 * Sanitize filename for safe storage
 */
export function sanitizeFilename(filename: string): string {
  try {
    // Remove null bytes
    let sanitized = filename.replace(/\0/g, '')

    // Remove path traversal attempts
    sanitized = sanitized.replace(/[\/\\:*?"<>|]/g, '_')

    // Remove any remaining .. sequences
    sanitized = sanitized.replace(/\.{2,}/g, '_')

    // Remove leading/trailing dots and spaces
    sanitized = sanitized.replace(/^[.\s]+|[.\s]+$/g, '')

    // Limit length
    const maxLength = 255
    if (sanitized.length > maxLength) {
      const extension = sanitized.includes('.') ? (sanitized.split('.').pop() ?? '') : ''
      const nameWithoutExt = sanitized.includes('.') ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized
      const maxNameLength = maxLength - extension.length - (extension ? 1 : 0)
      sanitized = nameWithoutExt.substring(0, maxNameLength) + (extension ? '.' + extension : '')
    }

    // Ensure filename is not empty
    if (!sanitized || sanitized === '.') {
      sanitized = 'file'
    }

    // Add timestamp if filename is too generic
    const genericNames = ['file', 'document', 'image', 'upload']
    const baseName = sanitized.toLowerCase().split('.')[0] ?? ''
    if (genericNames.includes(baseName)) {
      const timestamp = Date.now()
      const extension = sanitized.includes('.') ? '.' + (sanitized.split('.').pop() ?? '') : ''
      sanitized = `file_${timestamp}${extension}`
    }

    return sanitized
  } catch (err) {
    logger.error({ err, filename }, 'Error sanitizing filename')
    return `file_${Date.now()}`
  }
}

/**
 * Perform additional security checks on files
 */
function performFileSecurityChecks(file: File): FileValidationResult {
  try {
    // Check for suspicious filenames
    const suspiciousPatterns = [
      /\.php$/i,
      /\.jsp$/i,
      /\.asp$/i,
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.vbs$/i,
      /\.js$/i, // Restrict JavaScript files
      /\.html$/i, // Restrict HTML files
      /\.htm$/i,
    ]

    const isSuspicious = suspiciousPatterns.some((pattern) => pattern.test(file.name))

    if (isSuspicious) {
      return {
        isValid: false,
        error: 'File type not allowed for security reasons',
      }
    }

    // Check for double extensions
    const parts = file.name.split('.')
    if (parts.length > 2) {
      const secondLastExt = parts[parts.length - 2]?.toLowerCase()
      const dangerousSecondExts = ['php', 'asp', 'jsp', 'exe', 'bat', 'cmd']

      if (secondLastExt !== undefined && dangerousSecondExts.includes(secondLastExt)) {
        return {
          isValid: false,
          error: 'Double file extensions not allowed',
        }
      }
    }

    // Check filename length
    if (file.name.length > 255) {
      return {
        isValid: false,
        error: 'Filename too long',
      }
    }

    return { isValid: true }
  } catch (err) {
    logger.error({ err, fileName: file.name }, 'Error in security checks')
    return {
      isValid: false,
      error: 'Security check failed',
    }
  }
}

/**
 * Validate and sanitize file upload
 */
export function validateAndSanitizeFile(file: File, options: FileValidationOptions = {}): FileValidationResult {
  try {
    const config = SECURITY_CONFIG.validation.files
    const {
      maxSize = config.maxSize,
      allowedTypes = config.allowedTypes,
      allowedExtensions = config.allowedExtensions,
    } = options

    // Extract file information
    const originalName = file.name
    const size = file.size
    const type = file.type
    const extension = originalName.includes('.') ? '.' + originalName.split('.').pop()?.toLowerCase() : ''

    // Validate file size
    if (size > maxSize) {
      return {
        isValid: false,
        error: `File size ${(size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(maxSize / 1024 / 1024).toFixed(2)}MB`,
      }
    }

    // Validate file type
    const isValidType = allowedTypes.some((allowedType) => allowedType === type)
    if (!type || !isValidType) {
      return {
        isValid: false,
        error: type
          ? `File type '${type}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
          : `File type is required. Allowed types: ${allowedTypes.join(', ')}`,
      }
    }

    // Validate file extension
    const isValidExtension = allowedExtensions.some((allowedExt) => allowedExt === extension)
    if (!extension || !isValidExtension) {
      return {
        isValid: false,
        error: extension
          ? `File extension '${extension}' is not allowed. Allowed extensions: ${allowedExtensions.join(', ')}`
          : `File extension is required. Allowed extensions: ${allowedExtensions.join(', ')}`,
      }
    }

    // Sanitize filename
    const sanitizedName = sanitizeFilename(originalName)

    // Additional security checks
    const securityChecks = performFileSecurityChecks(file)
    if (!securityChecks.isValid) {
      return securityChecks
    }

    logger.info(
      {
        originalName,
        sanitizedName,
        size,
        type,
        extension,
      },
      'File validated and sanitized'
    )

    const metadata: FileMetadata = {
      originalName,
      size,
      type,
      extension,
    }

    return {
      isValid: true,
      sanitizedName,
      metadata,
    }
  } catch (err) {
    logger.error({ err, fileName: file.name }, 'Error validating file')
    return {
      isValid: false,
      error: 'File validation failed',
    }
  }
}

/**
 * Sanitize URL to prevent open redirect attacks
 */
export function sanitizeUrl(url: string, allowedDomains: string[] = []): string | null {
  try {
    // Remove whitespace
    const cleanUrl = url.trim()

    // Check for empty URL
    if (!cleanUrl) {
      return null
    }

    // Allow relative URLs
    if (cleanUrl.startsWith('/') && !cleanUrl.startsWith('//')) {
      return cleanUrl
    }

    // Parse absolute URLs
    const parsedUrl = new URL(cleanUrl)

    // Check protocol
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      logger.warn({ url: cleanUrl, protocol: parsedUrl.protocol }, 'Invalid URL protocol')
      return null
    }

    // Check domain if allowedDomains is specified
    if (allowedDomains.length > 0) {
      const isAllowed = allowedDomains.some(
        (domain) => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith('.' + domain)
      )

      if (!isAllowed) {
        logger.warn({ url: cleanUrl, hostname: parsedUrl.hostname }, 'URL domain not allowed')
        return null
      }
    }

    return parsedUrl.toString()
  } catch (err) {
    logger.warn({ err, url }, 'Invalid URL format')
    return null
  }
}

/**
 * Sanitize JSON input to prevent prototype pollution
 */
export function sanitizeJson(jsonString: string): unknown {
  try {
    const parsed = safeJsonParse<unknown>(jsonString)

    // Remove dangerous properties
    const dangerousKeys = ['__proto__', 'constructor', 'prototype']

    function removeDangerousKeys(obj: unknown): unknown {
      if (obj === null || typeof obj !== 'object') {
        return obj
      }

      if (Array.isArray(obj)) {
        return obj.map(removeDangerousKeys)
      }

      const sanitized: Record<string, unknown> = {}
      const target = obj as Record<string, unknown>
      Object.keys(target).forEach((key) => {
        if (!dangerousKeys.includes(key)) {
          sanitized[key] = removeDangerousKeys(target[key])
        }
      })
      return sanitized
    }

    return removeDangerousKeys(parsed)
  } catch (err) {
    logger.warn({ err, jsonLength: jsonString.length }, 'Invalid JSON input')
    return null
  }
}

/**
 * Create a sanitization report for debugging
 */
export function createSanitizationReport(
  input: string,
  output: string,
  type: 'html' | 'text' | 'filename' | 'url'
): SanitizationReport {
  const securityIssuesFound: string[] = []

  // Check for common security issues in input
  if (input.includes('<script')) {
    securityIssuesFound.push('Script tag detected')
  }
  if (input.includes('javascript:')) {
    securityIssuesFound.push('JavaScript protocol detected')
  }
  if (input.includes('data:')) {
    securityIssuesFound.push('Data URL detected')
  }
  if (input.includes('../')) {
    securityIssuesFound.push('Path traversal attempt detected')
  }
  if (input.includes('<?php')) {
    securityIssuesFound.push('PHP code detected')
  }

  return {
    inputLength: input.length,
    outputLength: output.length,
    changed: input !== output,
    type,
    securityIssuesFound,
  }
}
