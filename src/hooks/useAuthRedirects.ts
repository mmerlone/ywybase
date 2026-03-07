'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ErrorPageCodeEnum } from '@/types/error.types'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/config/routes'
import { logger } from '@/lib/logger/client'

/**
 * Hook to handle authentication-related URL redirects.
 *
 * Specifically catches:
 * 1. Error parameters in URL query or hash (client-side only for hash).
 * 2. PKCE code parameters landing on the root route (fallback case).
 *
 * Includes a final session check before displaying errors to handle "already verified" scenarios.
 */
export function useAuthRedirects(): void {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthRedirects = async (): Promise<void> => {
      // 1. Detect error - prioritize searchParams, then check hash (Fragment error)
      const errorCode =
        searchParams.get('error_code') ??
        (typeof window !== 'undefined'
          ? new URLSearchParams(window.location.hash.substring(1)).get('error_code')
          : null)

      const code = searchParams.get('code')

      if (errorCode) {
        // Only if it's an expired OTP on root, check for session to allow a "graceful skip"
        if (errorCode === 'otp_expired' && window.location.pathname === '/') {
          const {
            data: { user },
          } = await supabase.auth.getUser()
          if (user) {
            router.replace(ROUTES.PROFILE.path)
            return
          }
        }

        // Redirect to standardized error page for any unhandled auth error landing here
        const errorPageUrl = new URL('/error', window.location.origin)
        errorPageUrl.searchParams.set(
          'code',
          errorCode === 'otp_expired' ? ErrorPageCodeEnum.AUTH_LINK_EXPIRED : ErrorPageCodeEnum.AUTH_CODE_INVALID
        )
        router.replace(errorPageUrl.pathname + errorPageUrl.search)
        return
      }

      // 2. Handle PKCE codes landing on root (Supabase fallback)
      //
      // TODO: Remove this fallback once Supabase email templates are locked down.
      //
      // This catches the case where Supabase redirects a PKCE `?code=` param to the
      // site root (`/`) instead of to `/api/auth/confirm`. This can happen when:
      //   - The Supabase Dashboard "Site URL" doesn't match the production domain
      //   - The "Redirect URLs" allowlist is missing the exact API route
      //   - Default email templates fail to propagate the `redirect_to` value
      //
      // To safely remove this fallback, verify in the Supabase Dashboard:
      //   1. Site URL is set to the production origin (not localhost)
      //   2. Redirect URLs allowlist includes the exact routes:
      //      - https://<domain>/api/auth/confirm
      //      - https://<domain>/api/auth/reset-password
      //   3. (Optional) Custom email templates hardcode the correct redirect path
      //
      // After confirming, monitor production logs to ensure this branch never fires,
      // then remove it.
      if (code && window.location.pathname === '/') {
        logger.debug(
          { code: code.substring(0, 8) + '…' },
          'PKCE root-fallback triggered: forwarding code to /api/auth/confirm'
        )
        router.replace(`/api/auth/confirm?code=${code}`)
      }
    }

    handleAuthRedirects().catch(() => {
      // Already logged
    })
  }, [searchParams, router, supabase])
}
