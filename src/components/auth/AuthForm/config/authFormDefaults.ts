import type {
  LoginFormInput,
  SignUpFormInput,
  ResetPasswordEmailFormInput,
  ResetPasswordPassFormInput,
  UpdatePasswordFormInput,
} from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Default values for each authentication operation
 * Provides clean form state and proper typing for form resets
 * Reuses existing types from @/types/auth.types.ts
 */

export const authFormDefaults = {
  [AuthOperationsEnum.LOGIN]: {
    email: '',
    password: '',
  } satisfies LoginFormInput,

  [AuthOperationsEnum.SIGN_UP]: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false,
  } satisfies SignUpFormInput,

  [AuthOperationsEnum.FORGOT_PASSWORD]: {
    email: '',
  } satisfies ResetPasswordEmailFormInput,

  [AuthOperationsEnum.SET_PASSWORD]: {
    password: '',
    confirmPassword: '',
  } satisfies ResetPasswordPassFormInput,

  [AuthOperationsEnum.UPDATE_PASSWORD]: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  } satisfies UpdatePasswordFormInput,
} as const
