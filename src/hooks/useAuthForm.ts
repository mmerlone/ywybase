import { useForm, type DefaultValues, type UseFormReturn, type Resolver } from 'react-hook-form'
import type { MutableRefObject } from 'react'
import type { ZodType } from 'zod'

import {
  addPasswordSchema,
  forgotPasswordEmailSchema,
  forgotPasswordPassSchema,
  loginSchema,
  signUpSchema,
  updatePasswordSchema,
} from '@/lib/validators/auth'
import { AuthOperationsEnum, type FormTypeMap } from '@/types/auth.types'
import { createSafeResolver } from '@/lib/utils/forms'

// Only form operations are included - SIGN_OUT and RESEND_VERIFICATION are not form operations
type FormOperation = keyof FormTypeMap

// Keyed mapped type so that schemaMap[K] preserves ZodType<FormTypeMap[K]> on lookup
const schemaMap: { [K in FormOperation]: ZodType<FormTypeMap[K]> } = {
  [AuthOperationsEnum.LOGIN]: loginSchema,
  [AuthOperationsEnum.SIGN_UP]: signUpSchema,
  [AuthOperationsEnum.FORGOT_PASSWORD]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.SET_PASSWORD]: forgotPasswordPassSchema,
  [AuthOperationsEnum.UPDATE_PASSWORD]: updatePasswordSchema,
  [AuthOperationsEnum.RESEND_VERIFICATION]: forgotPasswordEmailSchema,
  [AuthOperationsEnum.ADD_PASSWORD]: addPasswordSchema,
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
  [AuthOperationsEnum.RESEND_VERIFICATION]: {
    email: '',
  },
  [AuthOperationsEnum.ADD_PASSWORD]: {
    password: '',
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
 * @param {MutableRefObject<boolean>} [isTransitioning] - Optional ref to track operation transitions
 * @param {MutableRefObject<boolean>} [isDirtyRef] - Optional ref to track if form has been modified
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
export function useAuthForm<T extends FormOperation>(
  operation: T,
  isTransitioning?: MutableRefObject<boolean>,
  isDirtyRef?: MutableRefObject<boolean>
): UseFormReturn<FormTypeMap[T]> {
  const schema = schemaMap[operation]
  const defaultValues = defaultValuesMap[operation]

  // Safe resolver that catches ZodErrors thrown by zodResolver in onTouched mode
  const safeZodResolver = createSafeResolver(schema)

  /**
   * Custom resolver that skips validation during operation transitions
   * and before the user has made any changes (isDirty=false).
   * This prevents validation errors on untouched forms and during morph animations.
   */
  const conditionalResolver: Resolver<FormTypeMap[T]> = async (values, context, options) => {
    // Skip validation during operation transitions to prevent validation
    // errors on stale values when switching between auth operations
    if (isTransitioning?.current) {
      return { values: values, errors: {} }
    }

    // Skip validation until user has modified the form (isDirty becomes true)
    if (isDirtyRef && !isDirtyRef.current) {
      return { values: values, errors: {} }
    }

    // Use safe zodResolver (handles thrown ZodErrors)
    return safeZodResolver(values, context, options)
  }

  return useForm<FormTypeMap[T]>({
    resolver: conditionalResolver,
    // Use 'onTouched' mode for better UX - validation runs on blur/touch
    mode: 'onTouched',
    defaultValues: defaultValues as DefaultValues<FormTypeMap[T]>,
  })
}
