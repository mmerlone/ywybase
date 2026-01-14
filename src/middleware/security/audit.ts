/**
 * Security Audit Logging
 *
 * Comprehensive security event logging with PII sanitization,
 * event categorization, and audit trail creation using
 * configuration from src/config/security.ts.
 */

import { SECURITY_CONFIG } from '@/config/security'
import { buildLogger } from '@/lib/logger/client'
import { randomUUID } from 'crypto'
import type { NextRequest } from 'next/server'
import {
  SecurityEventType,
  SecurityEventContext,
  SecuritySeverity,
  AuditTrailEntry,
  UserActionAudit,
  SecurityReport,
  SecurityEventLogger,
  SecurityContextExtractor,
  SecurityContextSanitizer,
  AuditTrailCreator,
  UserActionAuditor,
  SecurityEventHelpers,
  AuthEventType,
  ValidationResult,
  isSecurityEventType,
} from '@/types/security.types'

const logger = buildLogger('security-audit')

/**
 * Sanitize nested objects and arrays recursively
 */
function sanitizeNestedObject(obj: Record<string, unknown>, piiFields: string[]): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    if (piiFields.includes(key.toLowerCase())) {
      // If the key itself is a PII field, redact the entire value
      sanitized[key] = '[REDACTED]'
    } else {
      // Handle the value based on its type
      if (Array.isArray(value)) {
        // Handle arrays: map each element and check PII
        sanitized[key] = value.map((element) => {
          if (typeof element === 'object' && element !== null && !Array.isArray(element)) {
            // Nested object - recurse
            return sanitizeNestedObject(element as Record<string, unknown>, piiFields)
          } else if (Array.isArray(element)) {
            // Nested array - map recursively
            return element.map((nestedElement) => {
              if (typeof nestedElement === 'object' && nestedElement !== null && !Array.isArray(nestedElement)) {
                return sanitizeNestedObject(nestedElement as Record<string, unknown>, piiFields)
              } else {
                return nestedElement
              }
            })
          } else {
            // Primitive in array - check if parent key is PII
            return piiFields.includes(key.toLowerCase()) ? '[REDACTED]' : element
          }
        })
      } else if (typeof value === 'object' && value !== null) {
        // Nested object - recurse
        sanitized[key] = sanitizeNestedObject(value as Record<string, unknown>, piiFields)
      } else {
        // Primitive - preserve
        sanitized[key] = value
      }
    }
  }

  return sanitized
}

/**
 * Get severity level for security event
 */
function getSeverityForEvent(event: SecurityEventType): SecuritySeverity {
  const severityMap: Record<SecurityEventType, SecuritySeverity> = {
    authentication_attempt: 'low',
    authentication_success: 'low',
    authentication_failure: 'medium',
    authorization_failure: 'high',
    suspicious_activity: 'high',
    rate_limit_exceeded: 'medium',
    csrf_token_mismatch: 'high',
    invalid_session: 'medium',
    privilege_escalation_attempt: 'critical',
    password_change: 'medium',
    password_reset: 'medium',
    email_verification: 'low',
    profile_update: 'low',
    file_upload: 'low',
    data_export: 'medium',
    admin_action: 'high',
    security_violation: 'critical',
  }

  return severityMap[event] || 'medium'
}

/**
 * Generate unique audit ID
 */
function generateAuditId(): string {
  return `audit_${Date.now()}_${randomUUID()}`
}

/**
 * Sanitize context data by removing or masking PII
 */
export const sanitizeSecurityContext: SecurityContextSanitizer = (
  context: SecurityEventContext
): SecurityEventContext => {
  try {
    const sanitized = { ...context }
    const piiFields = [...SECURITY_CONFIG.logging.piiFields] // Convert readonly to mutable

    // First: Apply special-case sanitization for specific fields
    piiFields.forEach((field) => {
      if (field === 'email' && sanitized.details?.email && typeof sanitized.details.email === 'string') {
        // Keep domain for email
        const email = sanitized.details.email as string
        const parts = email.split('@')
        sanitized.details.email = parts.length === 2 ? `***@${parts[1]}` : '[REDACTED_EMAIL]'
      } else if (field === 'ip_address' && sanitized.ip) {
        // Keep first two octets for IP
        const parts = sanitized.ip.split('.')
        sanitized.ip = parts.length === 4 ? `${parts[0]}.${parts[1]}.***.**` : '[REDACTED_IP]'
      } else if (field === 'user_agent' && sanitized.userAgent) {
        // Redact user agent
        sanitized.userAgent = '[REDACTED_USER_AGENT]'
      }
    })

    // Create a filtered piiFields list for recursive sanitization
    const recursivePiiFields = piiFields.filter((f) => !['email', 'ip_address', 'user_agent'].includes(f))

    // Second: Recursively sanitize nested objects in details and metadata
    if (sanitized.details) {
      sanitized.details = sanitizeNestedObject(sanitized.details, recursivePiiFields)
    }

    if (sanitized.metadata) {
      sanitized.metadata = sanitizeNestedObject(sanitized.metadata, recursivePiiFields)
    }

    return sanitized
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err : new Error(String(err)) }, 'Error sanitizing security context')
    return { ...context, details: { ...context.details, sanitizationError: true } }
  }
}

/**
 * Extract security context from request
 */
export const extractSecurityContext: SecurityContextExtractor = (
  request: NextRequest,
  additionalContext: Partial<SecurityEventContext> = {}
): SecurityEventContext => {
  return {
    ip:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.headers.get('x-vercel-forwarded-for') ||
      'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
    timestamp: new Date().toISOString(),
    ...additionalContext,
  }
}

/**
 * Create audit trail entry
 */
export const createAuditTrailEntry: AuditTrailCreator = (
  event: SecurityEventType,
  sanitizedContext: SecurityEventContext
): AuditTrailEntry => {
  const entry: AuditTrailEntry = {
    id: generateAuditId(),
    event,
    sanitizedContext,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.npm_package_version,
  }

  // In a production system, this would be stored in a database
  // For now, we'll just log it
  logger.info({ auditEntry: entry }, `Audit trail entry created: ${event}`)

  return entry
}

/**
 * Log security event with proper sanitization and categorization
 */
export const logSecurityEvent: SecurityEventLogger = (
  event: SecurityEventType,
  context: SecurityEventContext = {},
  message?: string
): void => {
  try {
    const config = SECURITY_CONFIG.logging

    // Check if event should be logged
    const shouldLog =
      (config.criticalEvents as readonly string[]).includes(event) ||
      (SECURITY_CONFIG.isProduction && (config.productionOnlyEvents as readonly string[]).includes(event)) ||
      !SECURITY_CONFIG.isProduction

    if (!shouldLog) {
      return
    }

    // Add standard context
    const fullContext: SecurityEventContext = {
      ...context,
      timestamp: context.timestamp || new Date().toISOString(),
      severity: context.severity || getSeverityForEvent(event),
    }

    // Sanitize context for logging
    const sanitizedContext = sanitizeSecurityContext(fullContext)

    // Create log entry
    const logEntry = {
      event,
      context: sanitizedContext,
      environment: process.env.NODE_ENV || 'unknown',
      message: message || `Security event: ${event}`,
    }

    // Log based on severity
    const severity = fullContext.severity || 'medium'

    switch (severity) {
      case 'critical':
        logger.error(logEntry, logEntry.message)
        break
      case 'high':
        logger.warn(logEntry, logEntry.message)
        break
      case 'medium':
        logger.info(logEntry, logEntry.message)
        break
      case 'low':
        logger.debug(logEntry, logEntry.message)
        break
    }

    // Store in audit trail if configured
    if ((config.criticalEvents as readonly string[]).includes(event)) {
      createAuditTrailEntry(event, sanitizedContext)
    }
  } catch (err: unknown) {
    logger.error({ err: err instanceof Error ? err : new Error(String(err)), event }, 'Error logging security event')
  }
}

/**
 * Audit user action with before/after values
 */
export const auditUserAction: UserActionAuditor = (
  userId: string,
  action: string,
  request: NextRequest,
  options = {}
): void => {
  try {
    const piiFields = [...SECURITY_CONFIG.logging.piiFields]

    const audit: UserActionAudit = {
      userId,
      action,
      resource: options.resource,
      resourceId: options.resourceId,
      oldValues: options.oldValues ? sanitizeNestedObject(options.oldValues, piiFields) : undefined,
      newValues: options.newValues ? sanitizeNestedObject(options.newValues, piiFields) : undefined,
      ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      success: options.success !== false,
      error: options.error,
    }

    logger.info({ userAudit: audit }, `User action audited: ${action}`)

    // Also log as security event if it's a sensitive action
    const actionToEventTypeMap: Record<string, SecurityEventType> = {
      delete_account: 'admin_action',
      change_password: 'admin_action',
      change_email: 'admin_action',
      export_data: 'data_export',
      admin_action: 'admin_action',
      user_creation: 'authentication_success',
      user_deletion: 'admin_action',
      password_change: 'admin_action',
      email_change: 'admin_action',
      role_change: 'admin_action',
      permission_change: 'admin_action',
      sensitive_data_access: 'security_violation',
    }

    // Check if action is in audited operations config
    const isAuditedAction = SECURITY_CONFIG.audit.auditedOperations.includes(
      action as (typeof SECURITY_CONFIG.audit.auditedOperations)[number]
    )

    if (isAuditedAction) {
      // Get the mapped event type, fallback to action name or default
      let eventType: SecurityEventType
      const mappedType = actionToEventTypeMap[action]

      if (mappedType) {
        eventType = mappedType
      } else if (isSecurityEventType(action)) {
        eventType = action as SecurityEventType
      } else {
        // Safe fallback: use admin_action for unknown sensitive operations
        eventType = 'admin_action'
      }

      logSecurityEvent(eventType, {
        userId,
        details: {
          originalAction: action,
          resource: options.resource,
          success: audit.success,
        },
      })
    }
  } catch (err: unknown) {
    logger.error(
      { err: err instanceof Error ? err : new Error(String(err)), userId, action },
      'Error auditing user action'
    )
  }
}

/**
 * Log suspicious activity with detailed context
 */
export function logSuspiciousActivity(
  request: NextRequest,
  reason: string,
  details: Record<string, unknown> = {}
): void {
  const context = extractSecurityContext(request, {
    severity: 'high',
    details: {
      reason,
      ...details,
    },
  })

  logSecurityEvent('suspicious_activity', context, `Suspicious activity detected: ${reason}`)
}

/**
 * Log authentication events
 */
export function logAuthenticationEvent(
  type: AuthEventType,
  request: NextRequest,
  userId?: string,
  details: Record<string, unknown> = {}
): void {
  const eventMap = {
    attempt: 'authentication_attempt' as const,
    success: 'authentication_success' as const,
    failure: 'authentication_failure' as const,
  }

  const context = extractSecurityContext(request, {
    userId,
    details,
  })

  logSecurityEvent(eventMap[type], context)
}

/**
 * Generate security report (would require database implementation)
 */
export function generateSecurityReport(startDate: Date, endDate: Date): SecurityReport {
  // This would require querying stored audit logs
  // For now, return empty report structure
  return {
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    totalEvents: 0,
    eventsByType: {} as Record<SecurityEventType, number>,
    eventsBySeverity: {
      low: 0,
      medium: 0,
      high: 0,
      critical: 0,
    },
    topIPs: [],
    suspiciousPatterns: [],
    recommendations: [],
  }
}

/**
 * Validate audit configuration
 */
export function validateAuditConfig(): ValidationResult {
  const issues: string[] = []

  try {
    const config = SECURITY_CONFIG.logging

    // Check critical events configuration
    if (config.criticalEvents.length > 0) {
      // Configuration is valid
    } else {
      issues.push('No critical events configured for logging')
    }

    // Check PII fields configuration
    if (config.piiFields.length > 0) {
      // Configuration is valid
    } else {
      issues.push('No PII fields configured for sanitization')
    }

    // Check retention configuration
    if (!config.retention || typeof config.retention !== 'object') {
      issues.push('Log retention configuration missing')
    } else {
      Object.entries(config.retention).forEach(([type, days]) => {
        if (typeof days !== 'number' || days <= 0) {
          issues.push(`Invalid retention period for ${type}: ${days}`)
        }
      })
    }

    return {
      isValid: issues.length === 0,
      issues,
    }
  } catch (error) {
    issues.push(`Error validating audit config: ${error}`)
    return {
      isValid: false,
      issues,
    }
  }
}

/**
 * Security event helpers for common scenarios
 */
export const SecurityEvents: SecurityEventHelpers = {
  loginAttempt: (request: NextRequest, email?: string) =>
    logAuthenticationEvent('attempt', request, undefined, { email }),

  loginSuccess: (request: NextRequest, userId: string) => logAuthenticationEvent('success', request, userId),

  loginFailure: (request: NextRequest, email?: string, reason?: string) =>
    logAuthenticationEvent('failure', request, undefined, { email, reason }),

  rateLimitExceeded: (request: NextRequest, limitType: string) =>
    logSecurityEvent(
      'rate_limit_exceeded',
      extractSecurityContext(request, {
        details: { limitType },
      })
    ),

  csrfViolation: (request: NextRequest) =>
    logSecurityEvent(
      'csrf_token_mismatch',
      extractSecurityContext(request, {
        severity: 'high',
      })
    ),

  suspiciousFileUpload: (request: NextRequest, fileName: string, reason: string) =>
    logSuspiciousActivity(request, 'Suspicious file upload', { fileName, reason }),

  privilegeEscalation: (request: NextRequest, userId: string, attemptedAction: string) =>
    logSecurityEvent(
      'privilege_escalation_attempt',
      extractSecurityContext(request, {
        userId,
        severity: 'critical',
        details: { attemptedAction },
      })
    ),
}
