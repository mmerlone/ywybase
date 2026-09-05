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
 * **Key Features**:
 * - Theme configured with `cssVariables: true` for automatic CSS variable generation
 * - `InitColorSchemeScript` in app/layout.tsx prevents flash of unstyled content (FOUC)
 * - Color scheme class applied to <html element for light/dark mode switching
 * - Theme mode persists via localStorage (key: 'mui-mode')
 * - System preference automatically detected when mode is 'system'
 * - Supports light/dark mode switching with no hydration mismatches
 *
 * @param {ThemeProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {ReactElement} Theme provider with CssBaseline
 *
 * @example
 * ```tsx
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
 * **Architecture**:
 * - ThemeProvider: Provides theme object and color scheme context
 * - CssBaseline: Normalizes default browser styles
 * - InitColorSchemeScript (in app/layout.tsx): Runs before React hydration to prevent FOUC
 *
 * **CSS Variables**:
 * - Generated automatically from theme palette
 * - Scoped within .light and .dark class selectors
 * - Prevents hydration mismatches between server and client
 *
 * **CssBaseline Effects**:
 * - Removes default margins
 * - Sets consistent box-sizing
 * - Normalizes typography
 * - Provides theme-aware background colors
 */
export function ThemeProvider({ children }: ThemeProviderProps): ReactElement {
  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </MuiThemeProvider>
  )
}
