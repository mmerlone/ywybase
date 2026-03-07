import type { AuthUser, Session } from '@supabase/supabase-js'

import type { AppError, AppErrorJSON, AuthErrorContext } from '@/types/error.types'

// Re-export AuthUser and Session
export type { AuthUser, Session }

/**
 * Authentication operations used in the application.
 * Defines the different types of authentication forms and flows.
 */
export const AuthOperationsEnum = {
  // Standard authentication
  LOGIN: 'login',
  SIGN_UP: 'sign-up',
  SIGN_OUT: 'sign-out',

  // SIGN UP: resend verification email
  RESEND_VERIFICATION: 'resend-verification',

  // Password reset flow (two-step)
  FORGOT_PASSWORD: 'forgot-password', // Step 1: Request password reset email (handles both initial request and resend)
  SET_PASSWORD: 'set-password', // Step 2: Set new password (token-auth from email link, new password fields only)

  // Account management
  UPDATE_PASSWORD: 'update-password', // For logged-in users to change their password (current password fields only)
  ADD_PASSWORD: 'add-password', // For OAuth users to add email/password login to their account

  // Future: Account Recovery
  // ACCOUNT_RECOVERY: 'account-recovery',

  // Future: MFA
  // SETUP_MFA: 'setup-mfa',
  // VERIFY_MFA: 'verify-mfa',
} as const

/**
 * Authentication providers supported by the application.
 *
 * @remarks
 * This enum defines the authentication providers that can be used for user authentication.
 * Each provider corresponds to an OAuth 2.0 or OpenID Connect identity provider.
 *
 * @example
 * ```typescript
 * // Using the AuthProvider enum
 * const provider: AuthProvider = AuthProvidersEnum.GOOGLE;
 *
 * // Checking provider type
 * if (provider === AuthProvidersEnum.GOOGLE) {
 *   // Handle Google authentication
 * }
 * ```
 */
export const AuthProvidersEnum = {
  /** Email/password provider (Supabase native) */
  EMAIL: 'email',
  /** Google OAuth 2.0 provider */
  GOOGLE: 'google',
  /** GitHub OAuth 2.0 provider */
  GITHUB: 'github',
  /** Facebook OAuth 2.0 provider */
  FACEBOOK: 'facebook',
  /** Twitter OAuth 2.0 provider */
  TWITTER: 'twitter',
  /** Microsoft OAuth 2.0 provider */
  MICROSOFT: 'microsoft',
  /** Apple Sign In provider */
  APPLE: 'apple',
  /** Discord OAuth 2.0 provider */
  DISCORD: 'discord',
  /** GitLab OAuth 2.0 provider */
  GITLAB: 'gitlab',
  /** Bitbucket OAuth 2.0 provider */
  BITBUCKET: 'bitbucket',
  /** Slack OAuth 2.0 provider */
  SLACK: 'slack',
  /** Spotify OAuth 2.0 provider */
  SPOTIFY: 'spotify',
  /** Twitch OAuth 2.0 provider */
  TWITCH: 'twitch',
  /** LinkedIn OAuth 2.0 provider */
  LINKEDIN: 'linkedin',
  /** Notion OAuth 2.0 provider */
  NOTION: 'notion',
  /** Zoom OAuth 2.0 provider */
  ZOOM: 'zoom',
  /** WorkOS SSO provider */
  WORKOS: 'workos',
} as const

/**
 * Type representing the string literal union of all AuthProvider values.
 *
 * @remarks
 * This type is derived from the AuthProvider enum and represents all possible
 * string values that can be used to identify an authentication provider.
 *
 * @example
 * ```typescript
 * // Valid values
 * const provider: AuthProvider = 'google'; // Valid
 * const provider2: AuthProvider = 'github'; // Valid
 *
 * // TypeScript error - invalid provider
 * const invalidProvider: AuthProvider = 'twitter'; // Error
 * ```
 */
export type AuthProvider = (typeof AuthProvidersEnum)[keyof typeof AuthProvidersEnum]

/**
 * Sign out reasons
 */
export const SignOutReasonEnum = {
  USER_ACTION: 'user_action',
  USER_NOT_FOUND: 'user_not_found',
  SESSION_EXPIRED: 'session_expired',
  UNKNOWN: 'unknown',
} as const

export const VerificationStatusEnum = {
  IDLE: 'idle',
  CHECKING: 'checking',
  UNVERIFIED: 'unverified',
  VERIFIED: 'verified',
} as const

/**
 * Represents an error that can be either:
 * - AppError: A full error instance from client-side error handling
 * - AppErrorJSON: A serialized error from server actions (crosses client-server boundary)
 *
 * Server actions must serialize errors to JSON for transmission, while client-side
 * error handlers return AppError instances. This union type accepts both forms.
 */
export type SerializableError = AppError | AppErrorJSON

/**
 * Type representing an authentication operation.
 * This is a string union type of all possible AuthOperations enum values.
 */
export type AuthOperations = (typeof AuthOperationsEnum)[keyof typeof AuthOperationsEnum]

/**
 * Represents the authentication result
 */
export type AuthResult = {
  error: Error | null
  data?: unknown
}

export type SignOutReason = (typeof SignOutReasonEnum)[keyof typeof SignOutReasonEnum]

/**
 * Configuration for an authentication provider in the application.
 * It includes provider-specific settings and OAuth parameters.
 *
 * @example
 * ```typescript
 * const googleConfig: AuthProviderConfig = {
 *   id: 'google',
 *   name: 'Google',
 *   scopes: 'email profile',
 *   params: {
 *     prompt: 'select_account',
 *     access_type: 'offline'
 *   }
 * };
 * ```
 */
export interface AuthProviderConfig {
  /**
   * The authentication provider identifier.
   * Must be one of the values from the AuthProvidersEnum.
   */
  id: AuthProvider

  /**
   * Display name of the authentication provider.
   * This is typically shown on the UI.
   */
  name: string

  /**
   * OAuth scopes to request from the provider.
   * Multiple scopes should be space-separated.
   *
   * @example
   * 'email profile openid'
   */
  scopes?: string
}

/**
 * Options for the login process.
 *
 * @remarks
 * This interface defines optional parameters that can be passed when initiating
 * the authentication flow.
 */
export interface SignInOptions {
  /**
   * The URL to redirect to after successful authentication.
   * If not provided, the user will be redirected to the default route.
   */
  redirectTo?: string

  /**
   * Override the default scopes for this authentication request.
   * If not provided, the scopes from the provider configuration will be used.
   */
  scopes?: string

  /**
   * Additional query parameters to include in the authentication request.
   * These will be appended to the OAuth URL.
   */
  queryParams?: Record<string, string>
}

/**
 * Type representing the authentication context
 */
export interface AuthContextType {
  // Auth state
  authUser: AuthUser | null
  session: Session | null
  error: SerializableError | null
  isLoading: boolean

  // Auth actions
  signIn: (email: string, password: string) => Promise<{ error: SerializableError | null }>
  signInWithProvider: (provider: AuthProvider) => Promise<{ error: SerializableError | null }>
  signUpWithEmail: (
    email: string,
    password: string,
    confirmPassword: string,
    acceptTerms: boolean,
    options?: { name: string }
  ) => Promise<{ error: SerializableError | null }>
  resetPassword: (email: string) => Promise<{ error: SerializableError | null }>
  signOut: (reason?: SignOutReason) => Promise<{ error: SerializableError | null }>
  refreshSession: () => Promise<void>

  // Utilities
  hasRole: (role: string) => boolean
  isCurrentUser: (userId: string) => boolean

  // Error boundary integration
  clearError: () => void
  getErrorForDisplay: () => {
    message: string
    code: string
    context?: AuthErrorContext
    isOperational: boolean
    statusCode: number | undefined
  } | null
  getErrorCode: () => string | null
  isAuthError: () => boolean
  isValidationError: () => boolean
  isNetworkError: () => boolean
}

/**
 * Form input types for authentication forms
 */

export interface LoginFormInput {
  email: string
  password: string
}

export interface SignUpFormInput extends LoginFormInput {
  confirmPassword: string
  name: string
  acceptTerms: boolean
}

/**
 * Type for signup credentials, excluding confirmPassword and acceptTerms
 * Used when submitting signup forms where these fields are handled separately
 */
export type SignupCredentials = Omit<SignUpFormInput, 'confirmPassword' | 'acceptTerms'> & {
  /**
   * User's full name
   */
  name: string
}

export interface ResetPasswordEmailFormInput {
  email: string
}

export interface ResetPasswordPassFormInput {
  password: string
  confirmPassword: string
}

export interface AddPasswordFormInput {
  password: string
  confirmPassword: string
}

export interface UpdatePasswordFormInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type FormTypeMap = {
  [AuthOperationsEnum.LOGIN]: LoginFormInput
  [AuthOperationsEnum.SIGN_UP]: SignUpFormInput
  [AuthOperationsEnum.FORGOT_PASSWORD]: ResetPasswordEmailFormInput
  [AuthOperationsEnum.SET_PASSWORD]: ResetPasswordPassFormInput
  [AuthOperationsEnum.UPDATE_PASSWORD]: UpdatePasswordFormInput
  [AuthOperationsEnum.ADD_PASSWORD]: AddPasswordFormInput
  [AuthOperationsEnum.RESEND_VERIFICATION]: ResetPasswordEmailFormInput
}

export type FormType = keyof FormTypeMap

export type VerificationStatusType = (typeof VerificationStatusEnum)[keyof typeof VerificationStatusEnum]

// Type guard for form inputs
export function isLoginFormInput(data: unknown): data is LoginFormInput {
  return (
    typeof data === 'object' && data !== null && 'email' in data && 'password' in data && Object.keys(data).length === 2
  )
}

export function isSignUpFormInput(data: unknown): data is SignUpFormInput {
  return (
    typeof data === 'object' &&
    data !== null &&
    'email' in data &&
    'password' in data &&
    'confirmPassword' in data &&
    'name' in data &&
    'acceptTerms' in data &&
    Object.keys(data).length === 5
  )
}
