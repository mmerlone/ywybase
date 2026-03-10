/**
 * @fileoverview Snackbar notification context for displaying toast messages.
 *
 * This module provides a global snackbar notification system using Material-UI's
 * Snackbar and Alert components. It allows components throughout the application
 * to display temporary messages with different severity levels (error, success,
 * warning, info).
 *
 * @module contexts/SnackbarContext
 */

import { Alert, type AlertColor, Snackbar } from '@mui/material'
import React, { createContext, useCallback, useContext, useState, type ReactElement } from 'react'

/**
 * Context type for snackbar notification functions.
 * Provides methods to display messages with different severity levels.
 *
 * @interface SnackbarContextType
 */
type SnackbarContextType = {
  /** Display a message with custom severity level */
  showMessage: (message: string, severity?: AlertColor) => void
  /** Display an error message (red alert) */
  showError: (message: string) => void
  /** Display a success message (green alert) */
  showSuccess: (message: string) => void
  /** Display a warning message (orange alert) */
  showWarning: (message: string) => void
  /** Display an info message (blue alert) */
  showInfo: (message: string) => void
}

/**
 * React context for snackbar notifications.
 * @internal
 */
const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined)

/**
 * Snackbar notification provider component.
 *
 * This component wraps the application (or a section of it) to provide global
 * snackbar notification capabilities. It manages the notification state and
 * renders a Material-UI Snackbar with Alert component at the top-center of
 * the viewport.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {ReactElement} Provider component with snackbar overlay
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * function App() {
 *   return (
 *     <SnackbarProvider>
 *       <YourAppComponents />
 *     </SnackbarProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * **Features**:
 * - Auto-hide after 6 seconds
 * - Positioned at top-center
 * - Click-away doesn't close (prevents accidental dismissal)
 * - Filled variant for better visibility
 * - Four severity helpers (error, success, warning, info)
 */
export function SnackbarProvider({ children }: { children: React.ReactNode }): ReactElement {
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [severity, setSeverity] = useState<AlertColor>('info')

  /**
   * Handle snackbar close event.
   * Prevents closing on clickaway to avoid accidental dismissal.
   *
   * @param {React.SyntheticEvent | Event} [event] - Close event
   * @param {string} [reason] - Reason for closing ('clickaway', 'timeout', etc.)
   * @internal
   */
  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string): void => {
    if (reason === 'clickaway') {
      return
    }
    setOpen(false)
  }

  const showMessage = useCallback((msg: string, sev: AlertColor = 'info'): void => {
    setMessage(msg)
    setSeverity(sev)
    setOpen(true)
  }, [])

  const showError = useCallback((msg: string): void => showMessage(msg, 'error'), [showMessage])
  const showSuccess = useCallback((msg: string): void => showMessage(msg, 'success'), [showMessage])
  const showWarning = useCallback((msg: string): void => showMessage(msg, 'warning'), [showMessage])
  const showInfo = useCallback((msg: string): void => showMessage(msg, 'info'), [showMessage])

  return (
    <SnackbarContext.Provider value={{ showMessage, showError, showSuccess, showWarning, showInfo }}>
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert onClose={handleClose} severity={severity} sx={{ width: '100%' }} variant="filled">
          {message}
        </Alert>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}

/**
 * Hook to access snackbar notification functions.
 *
 * Provides functions to display toast notifications with different severity levels.
 * Must be used within a SnackbarProvider component tree.
 *
 * @returns {SnackbarContextType} Object containing notification functions:
 * - `showMessage(message, severity?)`: Display custom severity message
 * - `showError(message)`: Display error message (red)
 * - `showSuccess(message)`: Display success message (green)
 * - `showWarning(message)`: Display warning message (orange)
 * - `showInfo(message)`: Display info message (blue)
 *
 * @throws {Error} If used outside of SnackbarProvider
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showSuccess, showError } = useSnackbar();
 *
 *   const handleSave = async () => {
 *     try {
 *       await saveData();
 *       showSuccess('Data saved successfully!');
 *     } catch (error) {
 *       showError('Failed to save data');
 *     }
 *   };
 *
 *   return <button onClick={handleSave}>Save</button>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * function FormComponent() {
 *   const { showWarning, showInfo } = useSnackbar();
 *
 *   return (
 *     <div>
 *       <button onClick={() => showWarning('Please review your input')}>Warn</button>
 *       <button onClick={() => showInfo('Processing...')}>Info</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useSnackbar(): SnackbarContextType {
  const context = useContext(SnackbarContext)
  if (context === undefined) {
    throw new Error('useSnackbar must be used within a SnackbarProvider')
  }
  return context
}
