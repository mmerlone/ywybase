import type { AuthUser, Session } from '@supabase/supabase-js'

import type { AppError, AppErrorJSON, AuthErrorContext } from '@/types/error.types'

// Re-export AuthUser and Session
export type { AuthUser, Session }

/**
 * Authentication operations used in the application.
 * Defines the different types of authentication forms and flows.
 */
export enum AuthOperationsEnum {
  // Standard authentication
  LOGIN = 'login',
  SIGN_UP = 'sign-up',
  SIGN_OUT = 'sign-out',

  // SIGN UP: resend verification email
  RESEND_VERIFICATION = 'resend-verification',

  // Password reset flow (two-step)
  FORGOT_PASSWORD = 'forgot-password', // Step 1: Request password reset email (handles both initial request and resend)
  SET_PASSWORD = 'set-password', // Step 2: Set new password (token-auth from email link, new password fields only)

  // Account management
  UPDATE_PASSWORD = 'update-password', // For logged-in users to change their password (current password fields only)

  // Future: Account Recovery
  // ACCOUNT_RECOVERY = 'account-recovery',

  // Future: MFA
  // SETUP_MFA = 'setup-mfa',
  // VERIFY_MFA = 'verify-mfa',
}

/**
 * Authentication providers supported by the application.
 *
 * @remarks
 * This enum defines the authentication providers that can be used for user authentication.
 * Each provider corresponds to an OAuth 2.0 or OpenID Connect identity provider.
 *
 * @example
 * ```typescript
 * // Using the AuthProviders enum
 * const provider: AuthProviders = AuthProvider.GOOGLE;
 *
 * // Checking provider type
 * if (provider === AuthProvidersEnum.GOOGLE) {
 *   // Handle Google authentication
 * }
 * ```
 */
export enum AuthProvidersEnum {
  /**
   * Google OAuth 2.0 provider.
   *
   * @remarks
   * Requires Google OAuth 2.0 credentials to be configured.
   *
   * @see [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
   */
  GOOGLE = 'google',

  /**
   * GitHub OAuth 2.0 provider.
   *
   * @remarks
   * Requires GitHub OAuth App to be configured.
   *
   * @see [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps/authorizing-oauth-apps)
   */
  GITHUB = 'github',

  /**
   * Microsoft OAuth 2.0 provider.
   *
   * @remarks
   * Requires Microsoft Identity Platform application to be configured.
   *
   * @see [Microsoft Identity Platform Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow)
   */
  MICROSOFT = 'microsoft',

  /**
   * Apple Sign In provider.
   *
   * @remarks
   * Requires Apple Developer account and Sign In with Apple configuration.
   *
   */
  APPLE = 'apple',
}

/**
 * Sign out reasons
 */
export enum SignOutReasonEnum {
  USER_ACTION = 'user_action',
  USER_NOT_FOUND = 'user_not_found',
  SESSION_EXPIRED = 'session_expired',
  UNKNOWN = 'unknown',
}

export enum VerificationStatusEnum {
  IDLE = 'idle',
  CHECKING = 'checking',
  UNVERIFIED = 'unverified',
  VERIFIED = 'verified',
}

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
export type AuthOperations = `${AuthOperationsEnum}`

/**
 * Represents the authentication result
 */
export type AuthResult = {
  error: Error | null
  data?: unknown
}

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
 * const provider: AuthProviderValue = 'google'; // Valid
 * const provider2: AuthProviderValue = 'github'; // Valid
 *
 * // TypeScript error - invalid provider
 * const invalidProvider: AuthProviderValue = 'twitter'; // Error
 * ```
 */
export type AuthProviderValue = `${AuthProvidersEnum}`
export type SignOutReason = `${SignOutReasonEnum}`

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
  id: AuthProviderValue

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
  signInWithProvider: (provider: AuthProvidersEnum) => Promise<{ error: SerializableError | null }>
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
}

export type FormType = keyof FormTypeMap

export type VerificationStatusType = `${VerificationStatusEnum}`

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
