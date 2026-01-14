/**
 * Profile Management Server Actions
 *
 * Server Actions for user profile operations:
 * - Profile CRUD (Create, Read, Update)
 * - Avatar upload and management
 * - Avatar optimization and cleanup
 *
 * @remarks
 * **Features**:
 * - Zod validation for all inputs
 * - Avatar file validation and sanitization
 * - Optimized image URLs with transformation
 * - Automatic old avatar cleanup
 * - Collision-free file naming
 *
 * **Avatar Storage**:
 * - Bucket: 'avatars'
 * - Path: `{userId}/{uniqueId}.{ext}`
 * - Max size: 5MB
 * - Formats: JPEG, PNG, WebP, GIF
 *
 * @module actions/profile
 */

'use server'

import DOMPurify from 'isomorphic-dompurify'
import { ErrorCodes } from '@/lib/error/codes'
import { BusinessError } from '@/lib/error/errors'
import {
  createServerActionSuccess,
  handleServerActionValidation,
  withServerActionErrorHandling,
} from '@/lib/error/server'
import type { AuthResponse } from '@/types/error.types'
import { buildLogger } from '@/lib/logger/server'
import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { profileUpdateSchema, profileCreateSchema } from '@/lib/validators/profile'
import { validateAndSanitizeFile } from '@/middleware/security/sanitize'
import { getOptimizedImageUrl, parseSupabaseStorageUrl, AVATAR_SIZES, isDefaultAvatar } from '@/lib/utils/image-utils'
import type { Profile, Database } from '@/types/database'
import type { ProfileUpdateData, ProfileCreateData } from '@/lib/validators/profile'

const logger = buildLogger('profile-server-actions')

const PROFILE_BUCKET = 'avatars'

/**
 * Extract storage path from Supabase storage URL.
 * Handles both full URLs and relative paths.
 *
 * @param url - Supabase storage URL to parse
 * @returns Storage path (without bucket) or null if invalid
 * @internal
 *
 * @example
 * ```typescript
 * const path = extractStoragePath(
 *   'https://project.supabase.co/storage/v1/object/public/avatars/user123/file.jpg'
 * )
 * // Returns: 'user123/file.jpg'
 * ```
 */
const extractStoragePath = (url: string | null): string | null => {
  if (!url) return null

  try {
    // Handle both full URLs and paths
    const urlObj = new URL(url)
    // Extract path after the bucket name
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    const bucketIndex = pathParts.indexOf(PROFILE_BUCKET)
    if (bucketIndex === -1 || bucketIndex === pathParts.length - 1) return null

    return pathParts.slice(bucketIndex + 1).join('/')
  } catch {
    // If URL parsing fails, assume it's already a storage path
    return url
  }
}

/**
 * Safely remove old avatar file from storage.
 * Prevents deletion of default avatars and the current file.
 *
 * @param supabase - Supabase client instance
 * @param oldAvatarUrl - URL of the old avatar to delete
 * @param newPath - New avatar path (to avoid deleting same file)
 * @param userId - User ID for logging
 * @internal
 *
 * @remarks
 * **Safety Checks**:
 * - Skips if no old avatar exists
 * - Skips if old avatar is a default
 * - Skips if old path matches new path
 * - Non-blocking: logs errors but doesn't throw
 */
const cleanupOldAvatar = async (
  supabase: SupabaseClient<Database>,
  oldAvatarUrl: string | null,
  newPath: string,
  userId: string
): Promise<void> => {
  if (!oldAvatarUrl) return

  const oldPath = extractStoragePath(oldAvatarUrl)
  if (!oldPath || isDefaultAvatar(oldPath) || oldPath === newPath) return

  try {
    const { error } = await supabase.storage.from(PROFILE_BUCKET).remove([oldPath])
    if (error) throw error
    logger.info({ userId, oldPath }, 'Successfully cleaned up old avatar')
  } catch (error) {
    // Don't fail the operation if cleanup fails, just log it
    logger.error({ userId, oldPath, error }, 'Failed to clean up old avatar')
  }
}

/**
 * Avatar file validation constraints.
 * Defines allowed formats, sizes, and types.
 *
 * @constant
 */
const AVATAR_VALIDATION: {
  /** Maximum file size in bytes (5MB) */
  maxSize: number
  /** Allowed MIME types */
  allowedTypes: string[]
  /** Allowed file extensions */
  allowedExtensions: string[]
} = {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
}

/**
 * Get a user's profile by ID.
 * Returns profile data or null if not found.
 *
 * @param userId - The user ID to fetch profile for
 * @returns Promise resolving to profile data or null
 * @throws {BusinessError} If userId is missing
 *
 * @remarks
 * **Behavior**:
 * - Returns null if profile doesn't exist (not an error)
 * - Throws for database errors
 * - Requires valid user ID
 *
 * @example
 * ```typescript
 * const result = await getProfile('user-123')
 * if (result.success && result.data) {
 *   console.log('Display name:', result.data.display_name)
 *   console.log('Bio:', result.data.bio)
 * } else if (result.success && !result.data) {
 *   console.log('Profile not found')
 * }
 * ```
 */
export const getProfile = withServerActionErrorHandling(
  async (userId: string): Promise<AuthResponse<Profile | null>> => {
    logger.debug({ userId }, 'Fetching user profile')

    if (!userId) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'User ID is required',
        context: { operation: 'getProfile' },
        statusCode: 400,
      })
    }

    const supabase = await createClient()
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

    if (error) {
      if (error.code === 'PGRST116') {
        // Profile not found - return success with null data
        return createServerActionSuccess(null, 'Profile not found')
      }
      throw error
    }

    logger.info({ userId, profileId: data?.id }, 'Profile retrieved successfully')
    return createServerActionSuccess(data as Profile, 'Profile retrieved successfully')
  },
  {
    operation: 'getProfile',
    successMessage: 'Profile retrieved successfully',
  }
)

/**
 * Create a new user profile.
 * Validates input with Zod schema before insertion.
 *
 * @param userId - The user ID (should match auth user)
 * @param profileData - Profile data to create
 * @returns Promise resolving to created profile
 * @throws {BusinessError} If userId is missing or validation fails
 *
 * @remarks
 * **Validation**: Uses profileCreateSchema
 * **Required Fields**: email, display_name
 * **Auto-Revalidation**: Clears /profile cache
 *
 * @example
 * ```typescript
 * const result = await createProfile('user-123', {
 *   email: 'user@example.com',
 *   display_name: 'John Doe',
 *   bio: 'Software developer',
 *   location: 'San Francisco'
 * })
 * if (result.success) {
 *   console.log('Profile created:', result.data)
 * }
 * ```
 */
export const createProfile = withServerActionErrorHandling(
  async (userId: string, profileData: ProfileCreateData): Promise<AuthResponse<Profile>> => {
    logger.debug({ userId, profileData }, 'Creating user profile')

    if (!userId) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'User ID is required',
        context: { operation: 'createProfile' },
        statusCode: 400,
      })
    }

    // Validate input
    const validated = profileCreateSchema.safeParse(profileData)
    const validationError = handleServerActionValidation<Profile>(validated, {
      userId,
      operation: 'createProfile',
    })
    if (validationError) return validationError

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .insert({ id: userId, ...validated.data } as Database['public']['Tables']['profiles']['Insert'])
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info({ userId, profileId: data.id }, 'Profile created successfully')
    return createServerActionSuccess(data as Profile, 'Profile created successfully')
  },
  {
    operation: 'createProfile',
    revalidatePaths: ['/profile'],
    successMessage: 'Profile created successfully',
  }
)

/**
 * Update an existing user profile.
 * Only updates provided fields (partial update).
 *
 * @param userId - The user ID whose profile to update
 * @param updates - Profile fields to update
 * @returns Promise resolving to updated profile
 * @throws {BusinessError} If userId is missing or validation fails
 *
 * @remarks
 * **Validation**: Uses profileUpdateSchema
 * **Partial Updates**: Only provided fields are updated
 * **Auto-Revalidation**: Clears /profile cache
 *
 * @example
 * ```typescript
 * const result = await updateProfile('user-123', {
 *   display_name: 'John Smith',
 *   bio: 'Updated bio text',
 *   timezone: 'America/New_York'
 * })
 * if (result.success) {
 *   console.log('Profile updated:', result.data)
 * }
 * ```
 */
export const updateProfile = withServerActionErrorHandling(
  async (userId: string, updates: ProfileUpdateData): Promise<AuthResponse<Profile>> => {
    logger.debug({ userId, updates }, 'Updating profile')

    if (!userId) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'User ID is required',
        context: { operation: 'updateProfile' },
        statusCode: 400,
      })
    }

    // Validate input
    const validated = profileUpdateSchema.safeParse(updates)
    const validationError = handleServerActionValidation<Profile>(validated, {
      userId,
      operation: 'updateProfile',
    })
    if (validationError) return validationError

    // Ensure data exists after validation
    if (!validated.data) {
      return {
        success: false,
        error: 'Validation failed: No data to update',
      }
    }

    // Sanitize text fields to prevent XSS
    const sanitizedData = {
      ...validated.data,
      ...(validated.data.bio && { bio: DOMPurify.sanitize(validated.data.bio, { ALLOWED_TAGS: [] }) }),
      ...(validated.data.company && { company: DOMPurify.sanitize(validated.data.company, { ALLOWED_TAGS: [] }) }),
      ...(validated.data.job_title && {
        job_title: DOMPurify.sanitize(validated.data.job_title, { ALLOWED_TAGS: [] }),
      }),
    }

    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedData as Database['public']['Tables']['profiles']['Update'])
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    logger.info({ userId, profileId: data.id }, 'Profile updated successfully')
    return createServerActionSuccess(data as Profile, 'Profile updated successfully')
  },
  {
    operation: 'updateProfile',
    revalidatePaths: ['/profile'],
    successMessage: 'Profile updated successfully',
  }
)

/**
 * Upload and validate a profile avatar image.
 * Handles file validation, upload, optimization, and profile update.
 *
 * @param userId - The user ID who owns the avatar
 * @param file - The image file to upload (File object)
 * @returns Promise resolving to optimized avatar URL
 * @throws {BusinessError} If validation fails or userId is missing
 *
 * @remarks
 * **Upload Process**:
 * 1. Validate file (size, type, extension)
 * 2. Generate unique filename
 * 3. Upload to Supabase Storage
 * 4. Generate optimized URL (200x200 WebP)
 * 5. Update profile with new URL
 * 6. Clean up old avatar
 *
 * **Validation**:
 * - Max size: 5MB
 * - Types: JPEG, PNG, WebP, GIF
 * - Filename sanitization
 * - Collision prevention
 *
 * **Security**:
 * - Server-side validation
 * - File content verification
 * - Path sanitization
 *
 * @example
 * ```typescript
 * // In a form handler
 * const fileInput = document.getElementById('avatar') as HTMLInputElement
 * const file = fileInput.files?.[0]
 * if (file) {
 *   const result = await uploadAvatar('user-123', file)
 *   if (result.success) {
 *     console.log('Avatar URL:', result.data)
 *     // Update UI with new avatar
 *   } else {
 *     console.error('Upload failed:', result.error)
 *   }
 * }
 * ```
 */
export const uploadAvatar = withServerActionErrorHandling(
  async (userId: string, file: File): Promise<AuthResponse<string>> => {
    logger.debug({ userId, fileName: file.name }, 'Uploading avatar')

    if (!userId) {
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: 'User ID is required',
        context: { operation: 'uploadAvatar' },
        statusCode: 400,
      })
    }

    // Server-side validation
    const validation = validateAndSanitizeFile(file, AVATAR_VALIDATION)

    if (!validation.isValid) {
      logger.warn({ userId, fileName: file.name, error: validation.error }, 'Avatar validation failed')
      throw new BusinessError({
        code: ErrorCodes.validation.invalidInput(),
        message: validation.error || 'Invalid file',
        context: { operation: 'uploadAvatar' },
        statusCode: 400,
      })
    }

    const supabase = await createClient()

    // Get current profile to capture old avatar
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', userId)
      .single()

    if (fetchError) {
      logger.error({ userId, error: fetchError }, 'Failed to fetch current profile')
      throw new Error('Failed to fetch current profile')
    }

    const fileExt = file.name.split('.').pop()
    // Use crypto.randomUUID() to prevent filename collisions
    const uniqueId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
    const fileName = validation.sanitizedName || `${userId}-${uniqueId}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage.from(PROFILE_BUCKET).upload(filePath, file, {
      cacheControl: '3600',
      upsert: false, // Don't overwrite existing files
    })

    if (uploadError) {
      throw uploadError
    }

    // Generate optimized image URL using Supabase Transform
    const optimizedUrl = getOptimizedImageUrl(supabase, PROFILE_BUCKET, filePath, AVATAR_SIZES.medium)

    // Transaction-like behavior: Update profile with optimized avatar URL
    try {
      // Direct database update instead of calling updateProfile action
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: optimizedUrl })
        .eq('id', userId)
        .select()
        .single()

      if (updateError) {
        throw updateError
      }
    } catch (updateError) {
      // Attempt to clean up uploaded file on profile update failure
      try {
        await supabase.storage.from(PROFILE_BUCKET).remove([filePath])
        logger.warn({ userId, filePath }, 'Successfully cleaned up orphaned avatar file after profile update failure')
      } catch (cleanupError) {
        logger.error(
          { userId, filePath, cleanupError },
          'Failed to clean up orphaned avatar file after profile update failure'
        )
      }
      throw updateError
    }

    // Clean up old avatar after successful update
    await cleanupOldAvatar(supabase, currentProfile?.avatar_url || null, filePath, userId)

    logger.info({ userId, optimizedUrl, filePath }, 'Avatar uploaded successfully with optimization')
    return createServerActionSuccess(optimizedUrl, 'Avatar uploaded successfully')
  },
  {
    operation: 'uploadAvatar',
    revalidatePaths: ['/profile'],
    successMessage: 'Avatar uploaded successfully',
  }
)

/**
 * Get optimized avatar URLs for all sizes.
 * Generates thumbnail, small, medium, and large variants.
 *
 * @param avatarUrl - The stored avatar URL
 * @returns Promise resolving to object with size variants or null
 *
 * @remarks
 * **Sizes**:
 * - thumbnail: 100x100px
 * - small: 200x200px
 * - medium: 400x400px
 * - large: 800x800px
 *
 * **Format**: All URLs use WebP with quality optimization
 *
 * **Fallback**: Returns original URL for all sizes if parsing fails
 *
 * @example
 * ```typescript
 * const result = await getOptimizedAvatarUrls(profile.avatar_url)
 * if (result.success && result.data) {
 *   const { thumbnail, small, medium, large } = result.data
 *
 *   // Use in responsive images
 *   <img
 *     src={medium}
 *     srcSet={`${small} 200w, ${medium} 400w, ${large} 800w`}
 *     sizes="(max-width: 640px) 200px, 400px"
 *     alt="Avatar"
 *   />
 * }
 * ```
 */
export const getOptimizedAvatarUrls = withServerActionErrorHandling(
  async (
    avatarUrl: string | null
  ): Promise<AuthResponse<{ thumbnail: string; small: string; medium: string; large: string } | null>> => {
    if (!avatarUrl) {
      return createServerActionSuccess(null, 'No avatar URL provided')
    }

    // Use shared utility to parse the URL
    const pathInfo = parseSupabaseStorageUrl(avatarUrl)

    if (!pathInfo) {
      // URL doesn't match expected pattern, return as-is for all sizes
      const fallbackUrls = {
        thumbnail: avatarUrl,
        small: avatarUrl,
        medium: avatarUrl,
        large: avatarUrl,
      }
      return createServerActionSuccess(fallbackUrls, 'Avatar URLs generated (fallback)')
    }

    const { bucket, filePath } = pathInfo
    const supabase = await createClient()

    const urls = {
      thumbnail: getOptimizedImageUrl(supabase, bucket, filePath, AVATAR_SIZES.thumbnail),
      small: getOptimizedImageUrl(supabase, bucket, filePath, AVATAR_SIZES.small),
      medium: getOptimizedImageUrl(supabase, bucket, filePath, AVATAR_SIZES.medium),
      large: getOptimizedImageUrl(supabase, bucket, filePath, AVATAR_SIZES.large),
    }

    return createServerActionSuccess(urls, 'Avatar URLs generated successfully')
  },
  {
    operation: 'getOptimizedAvatarUrls',
    successMessage: 'Avatar URLs generated successfully',
  }
)
