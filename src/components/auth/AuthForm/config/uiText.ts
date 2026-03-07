import { AuthOperationsEnum, type AuthOperations } from '@/types/auth.types'

/**
 * User interface text and labels for authentication forms
 * Centralized text management for consistency and easy localization
 * Follows DRY principles with shared base configuration
 */

// Base operation labels - single source of truth for each context
const baseLabels = {
  [AuthOperationsEnum.LOGIN]: 'Login',
  [AuthOperationsEnum.SIGN_UP]: 'Sign Up',
  [AuthOperationsEnum.FORGOT_PASSWORD]: 'Forgot Password', // Title: What user is doing
  [AuthOperationsEnum.SET_PASSWORD]: 'Set New Password', // Title: What user is doing
  [AuthOperationsEnum.UPDATE_PASSWORD]: 'Change Password', // Title: What user is doing
  [AuthOperationsEnum.RESEND_VERIFICATION]: 'Resend Verification', // Title: What user is doing
  [AuthOperationsEnum.ADD_PASSWORD]: 'Add Password', // Title: OAuth users adding email/password
} as const

const buttonLabels = {
  [AuthOperationsEnum.LOGIN]: 'Login',
  [AuthOperationsEnum.SIGN_UP]: 'Sign Up',
  [AuthOperationsEnum.FORGOT_PASSWORD]: 'Send Reset Link', // Button: What action they're taking
  [AuthOperationsEnum.SET_PASSWORD]: 'Set Password', // Button: What action they're taking
  [AuthOperationsEnum.UPDATE_PASSWORD]: 'Update Password', // Button: What action they're taking
  [AuthOperationsEnum.RESEND_VERIFICATION]: 'Resend Link', // Button: What action they're taking
  [AuthOperationsEnum.ADD_PASSWORD]: 'Set Password', // Button: What action they're taking
} as const

// Type definitions for proper indexing
type OperationLabels = Record<AuthOperations, string>

export const uiText = {
  // Page titles - use appropriate title text
  titles: baseLabels as OperationLabels,

  // Button labels - use appropriate button text
  buttons: buttonLabels as OperationLabels,

  // Field labels
  fields: {
    email: 'Email',
    password: 'Password',
    currentPassword: 'Current Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    confirmNewPassword: 'Confirm New Password',
    name: 'Display Name',
    acceptTerms: 'I agree to the Terms of Service and Privacy Policy',
  },

  // Success messages
  success: {
    emailSent: 'Instructions Sent',
    emailSentDescription:
      "If an account exists with this email, we've sent instructions. Please check your inbox and your spam folder.",
    passwordUpdated: 'Password updated successfully',
    accountCreated: 'Account created successfully',
    accountCreatedDescription: 'Account created! Please check your email and spam folder to verify your account.',
    signedIn: 'Signed in successfully',
    verificationEmailSent: 'Verification email sent. Please check your inbox and spam folder.',
  },

  // Error messages
  errors: {
    generic: 'An error occurred',
    invalidCredentials: 'Invalid email or password',
    emailNotFound: 'If an account exists with this email, we have sent instructions to it.',
    emailAlreadyInUse: 'This email is already in use. Please login instead.',
    emailNotConfirmed:
      'Please verify your email address before logging in. Check your inbox for the confirmation link.',
    passwordTooWeak: 'Password does not meet requirements',
    networkError: 'Network error. Please check your connection.',
    sessionExpired: 'Your session has expired. Please login again.',
  },

  // Navigation links
  links: {
    forgotPassword: 'Forgot password?',
    signUp: "Don't have an account? Sign up",
    signIn: 'Already have an account? Login',
    resendVerification: "Didn't receive the email? Resend verification",
    backToSignIn: 'Back to Login',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
  },

  // Loading states
  loading: {
    signingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    sendingResetLink: 'Sending reset link...',
    resettingPassword: 'Resetting password...',
    updatingPassword: 'Updating password...',
  },

  // Social login
  social: {
    orContinueWith: 'Or continue with',
    signInWithGoogle: 'Continue with Google',
    signInWithGitHub: 'Continue with GitHub',
    signInWithMicrosoft: 'Continue with Microsoft',
  },
} as const
