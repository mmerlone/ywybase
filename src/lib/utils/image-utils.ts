/**
 * Image Optimization Utilities for Supabase Storage
 *
 * Provides utilities for generating optimized image URLs with Supabase's
 * built-in image transformation API.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Image transformation options for Supabase Storage
 */
export interface ImageTransformOptions {
  width?: number
  height?: number
  resize?: 'cover' | 'contain' | 'fill'
  format?: 'webp' | 'jpg' | 'png' | 'avif'
  quality?: number
}

/**
 * Predefined image size configurations for avatars
 */
export const AVATAR_SIZES = {
  thumbnail: {
    width: 50,
    height: 50,
    resize: 'cover' as const,
    format: 'webp' as const,
    quality: 80,
  },
  small: {
    width: 100,
    height: 100,
    resize: 'cover' as const,
    format: 'webp' as const,
    quality: 80,
  },
  medium: {
    width: 200,
    height: 200,
    resize: 'cover' as const,
    format: 'webp' as const,
    quality: 80,
  },
  large: {
    width: 400,
    height: 400,
    resize: 'cover' as const,
    format: 'webp' as const,
    quality: 85,
  },
} as const

/**
 * Generate an optimized image URL using Supabase's image transformation
 *
 * @param client - Supabase client instance
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file in storage
 * @param options - Transformation options
 * @returns Optimized image URL
 *
 * @example
 * ```typescript
 * const url = getOptimizedImageUrl(
 *   supabaseClient,
 *   'avatars',
 *   'user-123/avatar.jpg',
 *   AVATAR_SIZES.medium
 * )
 * ```
 */
export function getOptimizedImageUrl(
  client: SupabaseClient<Database>,
  bucket: string,
  filePath: string,
  options?: ImageTransformOptions
): string {
  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(filePath, {
    transform: options
      ? {
          width: options.width,
          height: options.height,
          resize: options.resize,
          quality: options.quality,
        }
      : undefined,
  })

  return publicUrl
}

/**
 * Generate multiple optimized image URLs for responsive images
 *
 * @param client - Supabase client instance
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file in storage
 * @returns Object with URLs for different sizes
 *
 * @example
 * ```typescript
 * const urls = getResponsiveImageUrls(supabaseClient, 'avatars', 'user-123/avatar.jpg')
 * // urls.thumbnail -> 50x50 WebP
 * // urls.small     -> 100x100 WebP
 * // urls.medium    -> 200x200 WebP
 * // urls.large     -> 400x400 WebP
 * ```
 */
export function getResponsiveImageUrls(
  client: SupabaseClient<Database>,
  bucket: string,
  filePath: string
): Record<keyof typeof AVATAR_SIZES, string> {
  return {
    thumbnail: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.thumbnail),
    small: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.small),
    medium: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.medium),
    large: getOptimizedImageUrl(client, bucket, filePath, AVATAR_SIZES.large),
  }
}

/**
 * Get the base (unoptimized) URL for an image
 * Useful for fallback or original image access
 *
 * @param client - Supabase client instance
 * @param bucket - Storage bucket name
 * @param filePath - Path to the file in storage
 * @returns Base public URL
 */
export function getBaseImageUrl(client: SupabaseClient<Database>, bucket: string, filePath: string): string {
  const {
    data: { publicUrl },
  } = client.storage.from(bucket).getPublicUrl(filePath)

  return publicUrl
}

/**
 * Helper to determine optimal avatar size based on container dimensions
 *
 * @param containerSize - The size of the container in pixels
 * @returns The appropriate avatar size configuration
 *
 * @example
 * ```typescript
 * const size = getOptimalAvatarSize(150)
 * // Returns AVATAR_SIZES.medium (200x200)
 * ```
 */
export function getOptimalAvatarSize(containerSize: number): ImageTransformOptions {
  if (containerSize <= 50) return AVATAR_SIZES.thumbnail
  if (containerSize <= 100) return AVATAR_SIZES.small
  if (containerSize <= 200) return AVATAR_SIZES.medium
  return AVATAR_SIZES.large
}

/**
 * Extract bucket and file path from Supabase Storage public URL
 *
 * Supabase Storage URLs follow the pattern:
 * https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
 *
 * @param url - Supabase Storage public URL
 * @returns Object with bucket and filePath, or null if URL doesn't match pattern
 *
 * @example
 * ```typescript
 * const info = parseSupabaseStorageUrl('https://proj.supabase.co/storage/v1/object/public/avatars/user-123/avatar.jpg')
 * // Returns: { bucket: 'avatars', filePath: 'user-123/avatar.jpg' }
 * ```
 */
export function parseSupabaseStorageUrl(url: string | null): { bucket: string; filePath: string } | null {
  if (!url) return null

  // Supabase URLs follow the pattern: https://{project}.supabase.co/storage/v1/object/public/{bucket}/{path}
  const urlParts = url.split('/storage/v1/object/public/')
  if (urlParts.length !== 2) return null

  const [, bucketAndPath] = urlParts
  if (!bucketAndPath) return null

  const pathParts = bucketAndPath.split('/')
  const bucket = pathParts[0]
  const filePath = pathParts.slice(1).join('/')

  // Remove any existing transform parameters
  const cleanFilePath = filePath.split('?')[0]

  if (!bucket || !cleanFilePath) return null

  return { bucket, filePath: cleanFilePath }
}

/**
 * Checks if an avatar path is a default/system avatar
 * @param path - The avatar path to check
 * @returns boolean indicating if the path is a default avatar
 */
export const isDefaultAvatar = (path: string | null): boolean => {
  if (!path) return false
  return path.startsWith('default/') || path.startsWith('system/')
}
