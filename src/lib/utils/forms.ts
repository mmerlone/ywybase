import { zodResolver } from '@hookform/resolvers/zod'
import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import { ZodError, type ZodType } from 'zod'

/**
 * Creates a safe React Hook Form resolver that wraps zodResolver to prevent uncaught ZodErrors.
 *
 * @remarks
 * **Problem**: In `@hookform/resolvers` v3.3.x, `zodResolver` throws ZodError objects instead
 * of returning them in React Hook Form's error format. This causes uncaught errors that appear
 * in the browser console as unhandled promise rejections, especially during:
 * - Form initialization with empty/invalid default values
 * - Field blur events before user interaction (with mode: 'onTouched')
 * - Operation/mode switches in multi-step forms
 *
 * **Solution**: This utility wraps `zodResolver` in a try/catch block and converts thrown
 * ZodError objects to React Hook Form's `FieldErrors` format, ensuring errors are properly
 * displayed in the UI rather than thrown to the console.
 *
 * **Usage**: Replace `zodResolver(schema)` with `createSafeResolver(schema)` in useForm config.
 *
 * @template T - The form data type that matches the Zod schema
 * @param schema - Zod validation schema for the form
 * @returns A React Hook Form resolver that catches and converts ZodErrors
 *
 * @example
 * ```tsx
 * const form = useForm({
 *   resolver: createSafeResolver(myFormSchema),
 *   mode: 'onTouched',
 *   defaultValues: { ... }
 * })
 * ```
 *
 * @see {@link https://github.com/react-hook-form/resolvers/issues/588} - Related issue
 */
export function createSafeResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  const zodResolverFn = zodResolver(schema)

  return async (values, context, options) => {
    try {
      return await zodResolverFn(values, context, options)
    } catch (error) {
      // Handle ZodError by converting it to RHF format to prevent uncaught errors
      if (error instanceof ZodError) {
        const rhfErrors: FieldErrors<T> = {}
        error.issues.forEach((issue) => {
          const fieldName = issue.path[0] as string
          ;(rhfErrors as Record<string, FieldErrors[string]>)[fieldName] = {
            type: issue.code,
            message: issue.message,
          }
        })
        return { values: {}, errors: rhfErrors }
      }
      // Re-throw non-Zod errors
      throw error
    }
  }
}
