import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'

/**
 * Utility functions for authentication components
 * Provides helper functions for type guards, data transformation, and common operations
 */

/**
 * Type guard to check if an operation requires email field
 */
export function operationRequiresEmail(operation: AuthOperations): boolean {
  const emailOperations: AuthOperations[] = [
    AuthOperationsEnum.LOGIN,
    AuthOperationsEnum.SIGN_UP,
    AuthOperationsEnum.FORGOT_PASSWORD,
  ]
  return emailOperations.includes(operation)
}

/**
 * Type guard to check if an operation requires password fields
 */
export function operationRequiresPassword(operation: AuthOperations): boolean {
  const passwordOperations: AuthOperations[] = [
    AuthOperationsEnum.LOGIN,
    AuthOperationsEnum.SIGN_UP,
    AuthOperationsEnum.SET_PASSWORD,
    AuthOperationsEnum.UPDATE_PASSWORD,
  ]
  return passwordOperations.includes(operation)
}

/**
 * Type guard to check if an operation requires name field
 */
export function operationRequiresName(operation: AuthOperations): boolean {
  return operation === AuthOperationsEnum.SIGN_UP
}

/**
 * Type guard to check if an operation requires terms acceptance
 */
export function operationRequiresTerms(operation: AuthOperations): boolean {
  return operation === AuthOperationsEnum.SIGN_UP
}

/**
 * Type guard to check if an operation shows social login buttons
 */
export function operationShowsSocialLogin(operation: AuthOperations): boolean {
  const socialLoginOperations: AuthOperations[] = [AuthOperationsEnum.LOGIN, AuthOperationsEnum.SIGN_UP]
  return socialLoginOperations.includes(operation)
}

/**
 * Get password field requirements for different operations
 */
export function getPasswordRequirements(operation: AuthOperations): {
  showCurrentPassword: boolean
  showNewPassword: boolean
  showConfirmPassword: boolean
  passwordLabel: string
} {
  switch (operation) {
    case AuthOperationsEnum.LOGIN:
      return {
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        passwordLabel: 'Password',
      }

    case AuthOperationsEnum.SIGN_UP:
      return {
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: true,
        passwordLabel: 'Password',
      }

    case AuthOperationsEnum.SET_PASSWORD:
      return {
        showCurrentPassword: false,
        showNewPassword: true,
        showConfirmPassword: true,
        passwordLabel: 'New Password',
      }

    case AuthOperationsEnum.UPDATE_PASSWORD:
      return {
        showCurrentPassword: true,
        showNewPassword: true,
        showConfirmPassword: true,
        passwordLabel: 'New Password',
      }

    default:
      return {
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false,
        passwordLabel: 'Password',
      }
  }
}

/**
 * Format operation enum for display purposes
 */
export function formatOperationForDisplay(operation: AuthOperations): string {
  return operation
    .split('-')
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if operation is a password reset flow
 */
export function isPasswordResetOperation(operation: AuthOperations): boolean {
  const passwordResetOperations: AuthOperations[] = [
    AuthOperationsEnum.FORGOT_PASSWORD,
    AuthOperationsEnum.SET_PASSWORD,
  ]
  return passwordResetOperations.includes(operation)
}
