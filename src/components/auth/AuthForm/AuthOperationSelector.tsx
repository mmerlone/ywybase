import type React from 'react'
import type { ReactElement } from 'react'
import LabelledToggle from '@/components/layout/LabelledToggle'
import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'
import type { LabelledToggleOption } from '@/types/components.types'

interface AuthOperationSelectorProps {
  currentOperation: AuthOperations
  onOperationChange: (operation: AuthOperations) => void
  disabled?: boolean
}

/**
 * Segmented control for switching between authentication operations.
 * Renders the reusable `LabelledToggle` to ensure WCAG 2.2 semantics using native radios.
 * Controlled via `currentOperation`/`onOperationChange`; supports `disabled` and full-width layout.
 */
export function AuthOperationSelector({
  currentOperation,
  onOperationChange,
  disabled = false,
}: AuthOperationSelectorProps): ReactElement {
  // Define the operations that users can switch between
  const operations: ReadonlyArray<LabelledToggleOption<AuthOperations>> = [
    { value: AuthOperationsEnum.LOGIN, label: 'Login' },
    { value: AuthOperationsEnum.SIGN_UP, label: 'Sign Up' },
    // { value: AuthOperationsEnum.FORGOT_PASSWORD, label: 'Forgot Password' },
    // { value: AuthOperationsEnum.UPDATE_PASSWORD, label: 'Update Password' },
    // { value: AuthOperationsEnum.SET_PASSWORD, label: 'Set Password' },
  ]

  return (
    <LabelledToggle
      ariaLabel="authentication operation selector"
      options={operations}
      value={currentOperation}
      onChange={onOperationChange}
      disabled={disabled}
      fullWidth
    />
  )
}
