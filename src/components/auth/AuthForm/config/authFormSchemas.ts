import {
  forgotPasswordEmailSchema,
  forgotPasswordPassSchema,
  loginSchema,
  signUpSchema,
  updatePasswordSchema,
  type LoginFormInput,
  type SignUpFormInput,
  type ResetPasswordEmailFormInput,
  type ResetPasswordPassFormInput,
  type UpdatePasswordFormInput,
} from '@/lib/validators/auth'
import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Integration layer that maps existing validation schemas to auth operations
 * Reuses existing validators from @/lib/validators.ts to avoid duplication
 */

// Re-export existing schemas for consistency
export const authFormSchemas = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.SIGN_UP]: signUpSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.SET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
} as const

// Union type for all form data using original type names
export type AuthFormData =
  | LoginFormInput
  | SignUpFormInput
  | ResetPasswordEmailFormInput
  | ResetPasswordPassFormInput
  | UpdatePasswordFormInput
