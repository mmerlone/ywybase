import { type NextRequest } from 'next/server'

import { withApiErrorHandler } from '@/lib/error/server'
import { withRateLimit } from '@/middleware/security/rate-limit'
import { createClient } from '@/lib/supabase/server'
import { handleEmailAuthCode } from '@/lib/utils/email-auth-handler'
import { AuthOperationsEnum } from '@/types/auth.types'

/**
 * Email Verification Handler
 *
 * This route handles the email verification link clicked by users after sign-up.
 * It performs the following steps:
 *
 * 1. Validates the PKCE code from the email link
 * 2. Exchanges the code for an authenticated session
 * 3. Auto-logs in the user
 * 4. Redirects to /profile with a success message
 *
 * Flow:
 * User signs up → Email sent → User clicks link → This handler → Auto-login → /profile
 *
 * @route GET /api/auth/confirm?code={pkce_code}
 */
export const GET = withRateLimit(
  'emailVerification',
  withApiErrorHandler(async (request: NextRequest) => {
    const supabase = await createClient()

    // Use shared email auth handler
    const result = await handleEmailAuthCode(request, supabase, {
      type: AuthOperationsEnum.SIGN_UP,
      successMessage: 'Email verified successfully! Welcome to your profile.',
      logContext: {
        flow: 'email-verification',
      },
    })

    return result.response
  })
)
