/**
 * @fileoverview Material-UI theme provider component.
 *
 * This module provides a Material-UI theme provider that wraps the application
 * with the configured theme, including CssBaseline for consistent styling and
 * theme mode persistence.
 *
 * @module components/providers/ThemeProvider
 */

'use client'

import { CssBaseline } from '@mui/material'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import React, { type ReactNode, type ReactElement } from 'react'

import theme from '@/theme'

/**
 * Props for the ThemeProvider component.
 * @interface ThemeProviderProps
 */
interface ThemeProviderProps {
  /** Child components to wrap with theme context */
  children: ReactNode
}

/**
 * Material-UI theme provider component.
 *
 * Wraps the application with Material-UI's ThemeProvider to apply the configured
 * theme throughout the component tree. Includes CssBaseline for consistent baseline
 * styles and supports theme mode persistence via localStorage.
 *
 * @param {ThemeProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {ReactElement} Theme provider with CssBaseline
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * function App() {
 *   return (
 *     <ThemeProvider>
 *       <YourAppComponents />
 *     </ThemeProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Features**:
 * - Applies configured Material-UI theme
 * - CssBaseline for consistent baseline styles
 * - Theme mode persistence via localStorage (key: 'mui-mode')
 * - Force theme re-render on mode changes
 * - Supports light/dark mode switching
 *
 * **CssBaseline Effects**:
 * - Removes default margins
 * - Sets consistent box-sizing
 * - Normalizes typography
 * - Provides theme-aware background colors
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  return (
    <MuiThemeProvider theme={theme} modeStorageKey="mui-mode" forceThemeRerender>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
