/**
 * Centralized Security Configuration
 *
 * Single source of truth for all security settings across the application.
 * This configuration consolidates security practices that were previously
 * scattered across multiple files.
 *
 * @see docs/security-consolidation-analysis.md for implementation details
 */

import type { SerializeOptions } from 'cookie'

// Environment-based configuration
const isProduction = process.env.NODE_ENV === 'production'
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Content Security Policy (CSP) Configuration
 *
 * Defines allowed sources for different types of content.
 * Stricter than current implementation to improve security posture.
 */
export const CSP_CONFIG = {
  // Core directives
  defaultSrc: ["'self'"],

  // Script sources - removed unsafe-inline/unsafe-eval for better security
  scriptSrc: [
    "'self'",
    // Allow nonce-based inline scripts
    "'nonce-{NONCE}'",
    // Supabase domains
    'https://*.supabase.co',
    // Development only: allow unsafe-eval for hot reloading
    ...(isDevelopment ? ["'unsafe-eval'"] : []),
  ],

  // Style sources
  styleSrc: [
    "'self'",
    "'unsafe-inline'", // Required for Material-UI and CSS-in-JS
    'https://fonts.googleapis.com',
  ],

  // Image sources
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'http:', // Allow HTTP images for development
    // Supabase storage
    'https://*.supabase.co',
  ],

  // Font sources
  fontSrc: ["'self'", 'data:', 'https://fonts.gstatic.com'],

  // Connection sources (fetch, WebSocket, EventSource)
  connectSrc: [
    "'self'",
    // Supabase API and realtime
    'https://*.supabase.co',
    'wss://*.supabase.co',
    // Sentry error reporting
    'https://*.sentry.io',
    // Development: allow localhost connections
    ...(isDevelopment ? ['http://localhost:*', 'ws://localhost:*'] : []),
  ],

  // Frame sources
  frameSrc: ["'self'", 'https://*.supabase.co'],

  // Object sources (plugins, embeds)
  objectSrc: ["'none'"],

  // Base URI for relative URLs
  baseUri: ["'self'"],

  // Form action targets
  formAction: ["'self'"],

  // Frame ancestors (who can embed this page)
  frameAncestors: ["'none'"],

  // Upgrade insecure requests in production
  ...(isProduction && { upgradeInsecureRequests: true }),
} as const

/**
 * Security Headers Configuration
 *
 * Comprehensive set of security headers to protect against various attacks.
 * Consolidates headers from multiple files into a single configuration.
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': '', // Will be generated from CSP_CONFIG

  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',

  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Enable XSS protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',

  // HTTP Strict Transport Security (HTTPS only in production)
  'Strict-Transport-Security': isProduction ? 'max-age=31536000; includeSubDomains; preload' : 'max-age=0', // Disable in development

  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Prevent MIME type sniffing for downloads
  'X-Download-Options': 'noopen',

  // Cross-Origin policies
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site',
  'Cross-Origin-Embedder-Policy': 'unsafe-none', // Required for some third-party integrations

  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'fullscreen=()',
    'payment=()',
    'usb=()',
    'magnetometer=()',
    'gyroscope=()',
    'accelerometer=()',
    'autoplay=()',
    'encrypted-media=()',
    'picture-in-picture=()',
  ].join(', '),

  // Server information (security through obscurity)
  Server: '',
  'X-Powered-By': '', // Remove default X-Powered-By header
} as const

/**
 * Cookie Security Configuration
 *
 * Secure defaults for all cookies, especially authentication cookies.
 */
export const COOKIE_CONFIG = {
  // Authentication cookies (Supabase)
  auth: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    // Domain will be set automatically by Next.js
  } satisfies SerializeOptions,

  // Session cookies
  session: {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  } satisfies SerializeOptions,

  // Preference cookies (theme, language, etc.)
  preferences: {
    httpOnly: false, // Accessible to client-side JavaScript
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  } satisfies SerializeOptions,

  // CSRF token cookies
  csrf: {
    httpOnly: false, // Needs to be accessible for CSRF token validation
    secure: isProduction,
    sameSite: 'strict' as const,
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  } satisfies SerializeOptions,
} as const

/**
 * Rate Limiting Configuration
 *
 * Different rate limits for different types of endpoints.
 */
export const RATE_LIMIT_CONFIG = {
  // Authentication endpoints (login, sign-up, password reset)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 999 : 5, // 999 in dev, 5 attempts per window in production
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // General API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDevelopment ? 999 : 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 999 : 10, // 10 uploads per hour
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Password reset endpoints (more restrictive)
  passwordReset: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 999 : 3, // 3 attempts per hour
    message: 'Too many password reset attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // Email verification endpoints
  emailVerification: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDevelopment ? 999 : 10, // 10 verification attempts per hour
    message: 'Too many verification attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
  },
} as const

/**
 * Input Validation Configuration
 *
 * Security constraints for user inputs and file uploads.
 */
export const VALIDATION_CONFIG = {
  // File upload constraints
  files: {
    maxSize: 5 * 1024 * 1024, // 5MB per file
    maxTotalSize: 50 * 1024 * 1024, // 50MB total per request
    allowedTypes: [
      // Images
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    maxFiles: 1, // Maximum files per upload
  },

  // Request size limits
  request: {
    maxBodySize: 10 * 1024 * 1024, // 10MB max request body
    maxUrlLength: 2048, // 2KB max URL length
    maxHeaderSize: 8192, // 8KB max header size
  },

  // String input constraints
  strings: {
    maxLength: 10000, // 10KB max string length
    maxLines: 1000, // Maximum lines in text input
    allowedCharsets: ['utf-8', 'ascii'],
  },

  // Database constraints
  database: {
    maxQueryComplexity: 100, // Prevent complex queries
    maxBatchSize: 100, // Maximum items in batch operations
    queryTimeout: 30000, // 30 seconds query timeout
  },
} as const

/**
 * Security Logging Configuration
 *
 * Defines what security events should be logged and how.
 */
export const SECURITY_LOGGING_CONFIG = {
  // Events that should always be logged
  criticalEvents: [
    'authentication_failure',
    'authorization_failure',
    'suspicious_activity',
    'rate_limit_exceeded',
    'csrf_token_mismatch',
    'invalid_session',
    'privilege_escalation_attempt',
  ],

  // Events that should be logged in production only
  productionOnlyEvents: ['successful_login', 'password_change', 'email_verification', 'profile_update'],

  // PII fields that should be sanitized in logs
  piiFields: [
    'password',
    'email',
    'phone',
    'address',
    'ssn',
    'credit_card',
    'ip_address', // Log IP but consider it PII
    'user_agent', // May contain identifying information
  ],

  // Log retention periods
  retention: {
    security: 90, // 90 days for security logs
    audit: 365, // 1 year for audit logs
    debug: 7, // 7 days for debug logs
    error: 30, // 30 days for error logs
  },
} as const

/**
 * CORS Configuration
 *
 * Cross-Origin Resource Sharing settings for API endpoints.
 */
export const CORS_CONFIG = {
  // Allowed origins
  origins: [
    ...(isProduction
      ? ['https://your-domain.com', 'https://www.your-domain.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000']),
  ],

  // Allowed methods
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Allowed headers
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-CSRF-Token', 'Accept', 'Origin'],

  // Exposed headers
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],

  // Credentials
  credentials: true,

  // Preflight cache
  maxAge: 86400, // 24 hours
} as const

/**
 * Security Audit Configuration
 *
 * Settings for security auditing and monitoring.
 */
export const AUDIT_CONFIG = {
  // Tables/operations that require audit logging
  auditedOperations: [
    'user_creation',
    'user_deletion',
    'password_change',
    'email_change',
    'role_change',
    'permission_change',
    'sensitive_data_access',
    'admin_action',
  ],

  // Sensitive routes that require extra monitoring
  sensitiveRoutes: ['/api/auth/*', '/api/admin/*', '/api/user/delete', '/api/user/export', '/profile/delete'],

  // Anomaly detection thresholds
  anomalyThresholds: {
    failedLoginAttempts: 10, // per hour
    rapidRequests: 100, // per minute
    unusualUserAgent: true,
    suspiciousIpPatterns: true,
  },
} as const

/**
 * Generate CSP header string from configuration
 */
export function generateCSPHeader(nonce?: string): string {
  const directives = Object.entries(CSP_CONFIG).map(([key, value]) => {
    if (key === 'upgradeInsecureRequests' && value === true) {
      return 'upgrade-insecure-requests'
    }

    const directiveName = key.replace(/([A-Z])/g, '-$1').toLowerCase()

    if (Array.isArray(value)) {
      const sources = value
        .map((source) => (nonce && source === "'nonce-{NONCE}'" ? `'nonce-${nonce}'` : source))
        .join(' ')
      return `${directiveName} ${sources}`
    }

    return `${directiveName} ${value}`
  })

  return directives.join('; ')
}

/**
 * Get security headers with generated CSP
 */
export function getSecurityHeaders(nonce?: string): Record<string, string> {
  return {
    ...SECURITY_HEADERS,
    'Content-Security-Policy': generateCSPHeader(nonce),
  }
}

/**
 * Security configuration validation
 *
 * Validates that all required environment variables and configurations are present.
 */
export function validateSecurityConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  // Check required environment variables
  const requiredEnvVars = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'NODE_ENV']

  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      errors.push(`Missing required environment variable: ${envVar}`)
    }
  }

  // Validate Supabase URL format
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS')
  }

  // Validate production-specific requirements
  if (isProduction) {
    if (!process.env.NEXT_PUBLIC_SENTRY_DSN) {
      errors.push('NEXT_PUBLIC_SENTRY_DSN is required in production')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Export all configurations for easy access
 */
export const SECURITY_CONFIG = {
  csp: CSP_CONFIG,
  headers: SECURITY_HEADERS,
  cookies: COOKIE_CONFIG,
  rateLimit: RATE_LIMIT_CONFIG,
  validation: VALIDATION_CONFIG,
  logging: SECURITY_LOGGING_CONFIG,
  cors: CORS_CONFIG,
  audit: AUDIT_CONFIG,

  // Utility functions
  generateCSPHeader,
  getSecurityHeaders,
  validateSecurityConfig,

  // Environment flags
  isProduction,
  isDevelopment,
} as const

// Type exports for TypeScript support
export type SecurityConfig = typeof SECURITY_CONFIG
export type CSPConfig = typeof CSP_CONFIG
export type SecurityHeaders = typeof SECURITY_HEADERS
export type CookieConfig = typeof COOKIE_CONFIG
export type RateLimitConfig = typeof RATE_LIMIT_CONFIG
export type ValidationConfig = typeof VALIDATION_CONFIG
export type SecurityLoggingConfig = typeof SECURITY_LOGGING_CONFIG
export type CorsConfig = typeof CORS_CONFIG
export type AuditConfig = typeof AUDIT_CONFIG
