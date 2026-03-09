/**
 * @fileoverview Authentication provider component and context hook.
 *
 * This module provides a React context wrapper for the internal useAuth hook,
 * making authentication state and methods available throughout the component tree.
 * It integrates with the centralized authentication system.
 *
 * @module components/providers/AuthProvider
 */

'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAuthRedirects } from '@/hooks/useAuthRedirects'
import type { AuthContextType } from '@/types/auth.types'

/**
 * React context for authentication state and methods.
 * @internal
 */
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * Props for the AuthProvider component.
 * @interface AuthProviderProps
 */
interface AuthProviderProps {
  /** Child components to wrap with auth context */
  children: ReactNode
}

/**
 * Authentication provider component.
 *
 * Wraps the application (or a section of it) to provide authentication state
 * and methods via React Context. It uses the useAuth hook internally and makes
 * its functionality available to all child components through useAuthContext.
 *
 * @param {AuthProviderProps} props - Component props
 * @param {ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} Provider component with auth context
 *
 * @example
 * ```tsx
 * // In app layout or root component
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <YourAppComponents />
 *     </AuthProvider>
 *   );
 * }
 * ```
 *
 * @remarks
 * - Must be used with 'use client' directive (client component)
 * - Provides access to all authentication operations
 * - Manages session state and user data
 * - Integrates with error handling system
 */
export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const auth = useAuth()
  useAuthRedirects()

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}

/**
 * Hook to access authentication context.
 *
 * Provides access to full authentication state and methods from anywhere within
 * the AuthProvider component tree. Use this when you need to perform auth operations
 * like sign in, sign out, or access error utilities.
 *
 * @returns {AuthContextType} Full authentication context containing:
 * - User and session state
 * - Authentication methods (login, signup, logout, etc.)
 * - Error handling utilities
 * - Loading states
 *
 * @throws {Error} If used outside of AuthProvider
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const { signIn, isLoading, error } = useAuthContext();
 *
 *   const handleLogin = async () => {
 *     const result = await signIn('user@example.com', 'password');
 *     if (result.error) {
 *       console.error('Login failed:', result.error);
 *     }
 *   };
 *
 *   return <button onClick={handleLogin} disabled={isLoading}>Login</button>;
 * }
 * ```
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}

// Re-export useCurrentUser from its canonical location in src/hooks/
export { useCurrentUser } from '@/hooks/useCurrentUser'
