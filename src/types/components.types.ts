/**
 * Component Types
 *
 * Type definitions for reusable UI components across the application.
 * Provides standardized sizing, variants, and option types for consistent component APIs.
 */

import type React from 'react'

/**
 * Standard component size options.
 * Used to provide consistent sizing across different UI components.
 */
export enum ComponentSizeEnum {
  /** Small size variant */
  SM = 'sm',
  /** Medium size variant (default) */
  MD = 'md',
  /** Large size variant */
  LG = 'lg',
}

/**
 * Type representing component size values.
 * Derived from ComponentSizeEnum for type safety.
 */
export type ComponentSize = `${ComponentSizeEnum}`

/**
 * Standard component visual variants.
 * Used to provide consistent styling patterns across different UI components.
 */
export enum ComponentVariantsEnum {
  /** Primary variant - typically used for main actions */
  PRIMARY = 'primary',
  /** Secondary variant - typically used for supporting actions */
  SECONDARY = 'secondary',
}

/**
 * Type representing component variant values.
 * Derived from ComponentVariantsEnum for type safety.
 */
export type ComponentVariant = `${ComponentVariantsEnum}`

/**
 * Configuration for a toggle button or radio button option with a label.
 *
 * @template T - The value type, constrained to string or number
 *
 * @example
 * ```typescript
 * const options: LabelledToggleOption<string>[] = [
 *   { label: 'Option 1', value: 'opt1', disabled: false },
 *   { label: 'Option 2', value: 'opt2', disabled: true, ariaLabel: 'Second option' }
 * ];
 * ```
 */
export type LabelledToggleOption<T extends string | number> = {
  /** The label content to display for this option */
  label: React.ReactNode
  /** The value associated with this option */
  value: T
  /** Whether this option should be disabled */
  disabled?: boolean
  /** Accessible label for screen readers (overrides default label) */
  ariaLabel?: string
}
