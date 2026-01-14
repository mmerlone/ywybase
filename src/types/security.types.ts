/**
 * Security Types
 *
 * Comprehensive type definitions for security utilities and configurations.
 * Used across all security modules to ensure type safety and consistency.
 */

import { NextRequest, NextResponse } from 'next/server'

/**
 * Security event severity levels
 */
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical'

/**
 * Security event types for audit logging
 */
export type SecurityEventType =
  | 'authentication_attempt'
  | 'authentication_success'
  | 'authentication_failure'
  | 'authorization_failure'
  | 'suspicious_activity'
  | 'rate_limit_exceeded'
  | 'csrf_token_mismatch'
  | 'invalid_session'
  | 'privilege_escalation_attempt'
  | 'password_change'
  | 'password_reset'
  | 'email_verification'
  | 'profile_update'
  | 'file_upload'
  | 'data_export'
  | 'admin_action'
  | 'security_violation'

/**
 * Security event context for audit logging
 */
export interface SecurityEventContext {
  userId?: string
  sessionId?: string
  ip?: string
  userAgent?: string
  path?: string
  method?: string
  timestamp?: string
  severity?: SecuritySeverity
  details?: Record<string, unknown>
  metadata?: Record<string, unknown>
}

/**
 * Audit trail entry
 */
export interface AuditTrailEntry {
  id: string
  event: SecurityEventType
  sanitizedContext: SecurityEventContext
  timestamp: string
  environment: string
  version?: string
}

/**
 * User action audit entry
 */
export interface UserActionAudit {
  userId: string
  action: string
  resource?: string
  resourceId?: string
  oldValues?: Record<string, unknown>
  newValues?: Record<string, unknown>
  ip: string
  userAgent: string
  timestamp: string
  success: boolean
  error?: string
}

/**
 * Security report interface
 */
export interface SecurityReport {
  period: { start: string; end: string }
  totalEvents: number
  eventsByType: Record<SecurityEventType, number>
  eventsBySeverity: Record<SecuritySeverity, number>
  topIPs: Array<{ ip: string; count: number }>
  suspiciousPatterns: string[]
  recommendations: string[]
}

/**
 * Rate limiting interfaces
 */
export interface RateLimitStore {
  get(key: string): Promise<RateLimitEntry | null>
  set(key: string, value: RateLimitEntry, ttl: number): Promise<void>
  increment(key: string, windowMs?: number): Promise<RateLimitEntry>
  delete(key: string): Promise<void>
}

export interface RateLimitEntry {
  count: number
  resetTime: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
}

export interface RateLimiterConfig {
  windowMs: number
  max: number
  message: string
  standardHeaders: boolean
  legacyHeaders: boolean
  keyGenerator?: (request: NextRequest) => string
  skip?: (request: NextRequest) => boolean
  onLimitReached?: (request: NextRequest, rateLimitResult: RateLimitResult) => void
}

export interface RateLimitStats {
  totalRequests: number
  blockedRequests: number
  blockRate: number
  topBlockedIPs: Array<{ ip: string; count: number }>
}

/**
 * Security headers interfaces
 */
export interface SecurityHeadersOptions {
  generateNonce?: boolean
  strictCSP?: boolean
  customHeaders?: Record<string, string>
  nonce?: string
}

export interface SecurityHeadersReport {
  headers: Record<string, string>
  securityScore: number
  recommendations: string[]
}

/**
 * Input sanitization interfaces
 */
export interface HtmlSanitizeOptions {
  allowedTags?: string[]
  allowedAttributes?: string[]
  stripTags?: boolean
  allowLinks?: boolean
}

export interface InputSanitizeOptions {
  maxLength?: number
  allowHtml?: boolean
  trimWhitespace?: boolean
  removeControlChars?: boolean
}

export interface FileValidationOptions {
  maxSize?: number
  allowedTypes?: string[]
  allowedExtensions?: string[]
}

export interface FileValidationResult {
  isValid: boolean
  error?: string
  sanitizedName?: string
  metadata?: FileMetadata
}

export interface FileMetadata {
  originalName: string
  size: number
  type: string
  extension: string
}

export interface SanitizationReport {
  inputLength: number
  outputLength: number
  changed: boolean
  type: 'html' | 'text' | 'filename' | 'url'
  securityIssuesFound: string[]
}

/**
 * CSRF protection interfaces
 */
export interface CsrfValidationResult {
  isValid: boolean
  token?: string
  error?: string
}

export interface CsrfClientHelper {
  cookieName: string
  headerName: string
  getToken(): string | null
  addToHeaders(headers: HeadersInit): HeadersInit
}

/**
 * Configuration validation interfaces
 */
export interface ValidationResult {
  isValid: boolean
  issues: string[]
  errors?: string[]
}

/**
 * Security middleware types
 */
export type SecurityMiddleware<TOptions = unknown> = (
  request: NextRequest,
  response: NextResponse,
  options?: TOptions
) => Promise<NextResponse>

export type SecurityHandler<T extends unknown[] = unknown[]> = (...args: T) => Promise<NextResponse>

export type SecurityWrapper<T extends unknown[] = unknown[]> = (handler: SecurityHandler<T>) => SecurityHandler<T>

/**
 * Authentication event types
 */
export type AuthEventType = 'attempt' | 'success' | 'failure'

/**
 * Security logging configuration
 */
export interface SecurityLoggingConfig {
  criticalEvents: string[]
  productionOnlyEvents: string[]
  piiFields: readonly string[]
  retention: {
    security: number
    audit: number
    debug: number
    error: number
  }
}

/**
 * Cookie security configuration
 */
export interface CookieSecurityConfig {
  httpOnly: boolean
  secure: boolean
  sameSite: 'strict' | 'lax' | 'none'
  path: string
  maxAge: number
  domain?: string
}

/**
 * CORS configuration
 */
export interface CorsConfig {
  origins: string[]
  methods: string[]
  allowedHeaders: string[]
  exposedHeaders: string[]
  credentials: boolean
  maxAge: number
}

/**
 * CSP configuration
 */
export interface CspConfig {
  defaultSrc: string[]
  scriptSrc: string[]
  styleSrc: string[]
  imgSrc: string[]
  fontSrc: string[]
  connectSrc: string[]
  frameSrc: string[]
  objectSrc: string[]
  baseUri: string[]
  formAction: string[]
  frameAncestors: string[]
  upgradeInsecureRequests?: boolean
}

/**
 * File upload security configuration
 */
export interface FileSecurityConfig {
  maxSize: number
  maxTotalSize: number
  allowedTypes: string[]
  allowedExtensions: string[]
  maxFiles: number
}

/**
 * Request validation configuration
 */
export interface RequestValidationConfig {
  maxBodySize: number
  maxUrlLength: number
  maxHeaderSize: number
}

/**
 * String validation configuration
 */
export interface StringValidationConfig {
  maxLength: number
  maxLines: number
  allowedCharsets: string[]
}

/**
 * Database security configuration
 */
export interface DatabaseSecurityConfig {
  maxQueryComplexity: number
  maxBatchSize: number
  queryTimeout: number
}

/**
 * Audit configuration
 */
export interface AuditConfig {
  auditedOperations: string[]
  sensitiveRoutes: string[]
  anomalyThresholds: {
    failedLoginAttempts: number
    rapidRequests: number
    unusualUserAgent: boolean
    suspiciousIpPatterns: boolean
  }
}

/**
 * Security event helpers interface
 */
export interface SecurityEventHelpers {
  loginAttempt: (request: NextRequest, email?: string) => void
  loginSuccess: (request: NextRequest, userId: string) => void
  loginFailure: (request: NextRequest, email?: string, reason?: string) => void
  rateLimitExceeded: (request: NextRequest, limitType: string) => void
  csrfViolation: (request: NextRequest) => void
  suspiciousFileUpload: (request: NextRequest, fileName: string, reason: string) => void
  privilegeEscalation: (request: NextRequest, userId: string, attemptedAction: string) => void
}

/**
 * Security utility function types
 */
export type SecurityEventLogger = (event: SecurityEventType, context?: SecurityEventContext, message?: string) => void

export type SecurityContextExtractor = (
  request: NextRequest,
  additionalContext?: Partial<SecurityEventContext>
) => SecurityEventContext

export type SecurityContextSanitizer = (context: SecurityEventContext) => SecurityEventContext

export type AuditTrailCreator = (event: SecurityEventType, sanitizedContext: SecurityEventContext) => AuditTrailEntry

export type UserActionAuditor = (
  userId: string,
  action: string,
  request: NextRequest,
  options?: {
    resource?: string
    resourceId?: string
    oldValues?: Record<string, unknown>
    newValues?: Record<string, unknown>
    success?: boolean
    error?: string
  }
) => void

/**
 * Type guards for security types
 */
export function isSecurityEventType(value: string): value is SecurityEventType {
  const validTypes: SecurityEventType[] = [
    'authentication_attempt',
    'authentication_success',
    'authentication_failure',
    'authorization_failure',
    'suspicious_activity',
    'rate_limit_exceeded',
    'csrf_token_mismatch',
    'invalid_session',
    'privilege_escalation_attempt',
    'password_change',
    'password_reset',
    'email_verification',
    'profile_update',
    'file_upload',
    'data_export',
    'admin_action',
    'security_violation',
  ]
  return validTypes.includes(value as SecurityEventType)
}

export function isSecuritySeverity(value: string): value is SecuritySeverity {
  return ['low', 'medium', 'high', 'critical'].includes(value)
}

export function isAuthEventType(value: string): value is AuthEventType {
  return ['attempt', 'success', 'failure'].includes(value)
}

/**
 * Utility types for security configuration
 */
export type SecurityConfigKey =
  | 'headers'
  | 'cookies'
  | 'rateLimit'
  | 'validation'
  | 'logging'
  | 'cors'
  | 'audit'
  | 'csp'

export type RateLimitType = 'auth' | 'api' | 'upload' | 'passwordReset' | 'emailVerification'

export type CookieType = 'auth' | 'session' | 'preferences' | 'csrf'

/**
 * Error types for security operations
 */
export class SecurityError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: SecuritySeverity = 'medium',
    public context?: Record<string, unknown>
  ) {
    super(message)
    this.name = 'SecurityError'
  }
}

export class RateLimitError extends SecurityError {
  constructor(
    message: string,
    public limit: number,
    public remaining: number,
    public resetTime: number,
    public retryAfter: number
  ) {
    super(message, 'RATE_LIMIT_EXCEEDED', 'medium')
    this.name = 'RateLimitError'
  }
}

export class CsrfError extends SecurityError {
  constructor(
    message: string,
    public tokenPresent: boolean = false
  ) {
    super(message, 'CSRF_VALIDATION_FAILED', 'high')
    this.name = 'CsrfError'
  }
}

export class ValidationError extends SecurityError {
  constructor(
    message: string,
    public field: string,
    public value?: unknown
  ) {
    super(message, 'VALIDATION_FAILED', 'medium')
    this.name = 'ValidationError'
  }
}

/**
 * Re-export commonly used Next.js types for convenience
 */
export type { NextRequest, NextResponse } from 'next/server'
