import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Utility functions for authentication components
 * Provides helper functions for type guards, data transformation, and common operations
 */

/**
 * Type guard to check if an operation requires email field
 */
export function operationRequiresEmail(operation: AuthOperationsEnum): boolean {
  return [AuthOperationsEnum.LOGIN, AuthOperationsEnum.SIGN_UP, AuthOperationsEnum.FORGOT_PASSWORD].includes(operation)
}

/**
 * Type guard to check if an operation requires password fields
 */
export function operationRequiresPassword(operation: AuthOperationsEnum): boolean {
  return [
    AuthOperationsEnum.LOGIN,
    AuthOperationsEnum.SIGN_UP,
    AuthOperationsEnum.SET_PASSWORD,
    AuthOperationsEnum.UPDATE_PASSWORD,
  ].includes(operation)
}

/**
 * Type guard to check if an operation requires name field
 */
export function operationRequiresName(operation: AuthOperationsEnum): boolean {
  return operation === AuthOperationsEnum.SIGN_UP
}

/**
 * Type guard to check if an operation requires terms acceptance
 */
export function operationRequiresTerms(operation: AuthOperationsEnum): boolean {
  return operation === AuthOperationsEnum.SIGN_UP
}

/**
 * Type guard to check if an operation shows social login buttons
 */
export function operationShowsSocialLogin(operation: AuthOperationsEnum): boolean {
  return [AuthOperationsEnum.LOGIN, AuthOperationsEnum.SIGN_UP].includes(operation)
}

/**
 * Get password field requirements for different operations
 */
export function getPasswordRequirements(operation: AuthOperationsEnum): {
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
export function formatOperationForDisplay(operation: AuthOperationsEnum): string {
  return operation
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Check if operation is a password reset flow
 */
export function isPasswordResetOperation(operation: AuthOperationsEnum): boolean {
  return [AuthOperationsEnum.FORGOT_PASSWORD, AuthOperationsEnum.SET_PASSWORD].includes(operation)
}
