/**
 * @fileoverview Avatar optimization hooks using Supabase image transformation.
 *
 * This module provides React hooks for accessing optimized avatar URLs at different
 * sizes using Supabase Storage's built-in image transformation API. It handles URL
 * parsing, client creation, and provides memoized optimization functions.
 *
 * @module hooks/useOptimizedAvatar
 */

import { useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  getOptimizedImageUrl,
  parseSupabaseStorageUrl,
  AVATAR_SIZES,
  type ImageTransformOptions,
} from '@/lib/utils/image-utils'

/**
 * Return type for useOptimizedAvatar hook.
 * @interface OptimizedAvatarReturn
 */
interface OptimizedAvatarReturn {
  /**
   * Get optimized avatar URL for a specific size.
   * @param {ImageTransformOptions} [size] - Transformation options (width, height, quality)
   * @returns {string | null} Optimized URL or original URL if not a Supabase storage URL
   */
  getUrl: (size?: ImageTransformOptions) => string | null
}

/**
 * Avatar optimization hook for different image sizes.
 *
 * This hook provides a function to get optimized avatar URLs using Supabase's
 * image transformation API. It parses storage URLs, creates optimized versions,
 * and returns the transformed URLs. Falls back to the original URL if it's not
 * a Supabase storage URL.
 *
 * @param {string | null} avatarUrl - The stored avatar URL from the profile
 * @returns {OptimizedAvatarReturn} Object with getUrl function
 *
 * @example
 * ```typescript
 * function UserAvatar({ profile }) {
 *   const avatarUrls = useOptimizedAvatar(profile.avatar_url)
 *
 *   return (
 *     <img
 *       src={avatarUrls.medium}
 *       srcSet={`${avatarUrls.small} 1x, ${avatarUrls.medium} 2x`}
 *       alt="User avatar"
 *     />
 *   )
 * }
 * ```
 */
export function useOptimizedAvatar(avatarUrl: string | null): OptimizedAvatarReturn {
  // Memoize the client to prevent recreation on every render
  const client = useMemo(() => createClient(), [])

  return useMemo(() => {
    return {
      getUrl: (size?: ImageTransformOptions): string | null => {
        const pathInfo = parseSupabaseStorageUrl(avatarUrl)

        if (!pathInfo) {
          return avatarUrl
        }

        const { bucket, filePath } = pathInfo
        const sizeOptions = size || AVATAR_SIZES.medium
        return getOptimizedImageUrl(client, bucket, filePath, sizeOptions)
      },
    }
  }, [avatarUrl, client])
}

/**
 * Avatar URL optimization hook with custom transformation options.
 *
 * This hook provides a direct optimized avatar URL with custom transformation
 * options. It's more convenient than useOptimizedAvatar when you need a single
 * URL with specific dimensions and quality settings. The hook handles URL parsing,
 * applies transformations, and returns the optimized URL.
 *
 * @param {string | null} avatarUrl - The stored avatar URL from the profile
 * @param {ImageTransformOptions} [options=AVATAR_SIZES.medium] - Custom transformation options
 * @returns {string | null} Optimized image URL or original URL if not transformable
 *
 * @example
 * ```typescript
 * function LargeAvatar({ profile }) {
 *   const avatarUrl = useOptimizedAvatarUrl(profile.avatar_url, {
 *     width: 500,
 *     height: 500,
 *     quality: 90,
 *   })
 *
 *   return <img src={avatarUrl} alt="User avatar" />
 * }
 * ```
 */
export function useOptimizedAvatarUrl(
  avatarUrl: string | null,
  options: ImageTransformOptions = AVATAR_SIZES.medium
): string | null {
  // Memoize the client to prevent recreation on every render
  const client = useMemo(() => createClient(), [])

  return useMemo(() => {
    const pathInfo = parseSupabaseStorageUrl(avatarUrl)

    if (!pathInfo) {
      return avatarUrl
    }

    const { bucket, filePath } = pathInfo
    return getOptimizedImageUrl(client, bucket, filePath, options)
  }, [avatarUrl, options, client])
}
