import { zodResolver } from '@hookform/resolvers/zod'
import type { DefaultValues, UseFormReturn } from 'react-hook-form'
import { useForm } from 'react-hook-form'
import { ZodType } from 'zod'

import {
  forgotPasswordEmailSchema,
  forgotPasswordPassSchema,
  loginSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/validators'
import type { FormTypeMap } from '@/types/auth.types'
import { AuthOperationsEnum } from '@/types/auth.types'

// Only form operations are included - SIGN_OUT and RESEND_VERIFICATION are not form operations
type FormOperation = keyof FormTypeMap

const schemaMap: Record<FormOperation, ZodType<unknown>> = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.SIGN_UP]: signUpSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.SET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
}

const defaultValuesMap: { [K in FormOperation]: FormTypeMap[K] } = {
  [AuthOperationsEnum.LOGIN]: {
    email: '',
    password: '',
  },
  [AuthOperationsEnum.SIGN_UP]: {
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    acceptTerms: false,
  },
  [AuthOperationsEnum.FORGOT_PASSWORD]: {
    email: '',
  },
  [AuthOperationsEnum.SET_PASSWORD]: {
    password: '',
    confirmPassword: '',
  },
  [AuthOperationsEnum.UPDATE_PASSWORD]: {
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  },
}

/**
 * Authentication form hook that provides form management with validation for different auth operations.
 *
 * This hook integrates React Hook Form with Zod validation schemas to provide
 * type-safe form handling for authentication operations including login, registration,
 * password reset, and password update forms.
 *
 * @template {AuthOperationsEnum} T - The authentication operation type
 * @param {T} operation - The authentication operation type (login, sign-up, etc.)
 * @returns {UseFormReturn<FormTypeMap[T]>} React Hook Form instance with:
 * - Form state and validation
 * - Form methods (register, handleSubmit, etc.)
 * - Error handling
 * - Form submission capabilities
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const form = useAuthForm(AuthOperationsEnum.LOGIN);
 *
 *   const onSubmit = form.handleSubmit(async (data) => {
 *     // data is typed as { email: string, password: string }
 *     console.log('Login data:', data);
 *   });
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       <input {...form.register('email')} />
 *       {form.formState.errors.email && (
 *         <span>{form.formState.errors.email.message}</span>
 *       )}
 *       <button type="submit">Login</button>
 *     </form>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * function SignUpForm() {
 *   const form = useAuthForm(AuthOperationsEnum.SIGN_UP);
 *
 *   return (
 *     <form onSubmit={form.handleSubmit(onSubmit)}>
 *       <input {...form.register('email')} />
 *       <input {...form.register('password')} />
 *       <input {...form.register('confirmPassword')} />
 *       <input {...form.register('name')} />
 *       <input {...form.register('acceptTerms')} type="checkbox" />
 *       <button type="submit">Sign Up</button>
 *     </form>
 *   );
 * }
 * ```
 */
export function useAuthForm<T extends FormOperation>(operation: T): UseFormReturn<FormTypeMap[T]> {
  const schema = schemaMap[operation]
  const defaultValues = defaultValuesMap[operation]

  return useForm<FormTypeMap[T]>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: defaultValues as DefaultValues<FormTypeMap[T]>,
  })
}
