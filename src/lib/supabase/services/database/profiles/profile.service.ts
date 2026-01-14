/**
 * Profile Service
 *
 * Abstract base service for profile-related database operations.
 * Provides shared business logic for both client and server implementations.
 *
 * @remarks
 * This service handles:
 * - Profile CRUD operations
 * - Avatar upload and optimization
 * - Data conversion between database and application formats
 * - File validation and security
 */

import { BaseService } from '../../base.service'
import { convertAppProfileForInsert, convertAppProfileForUpdate, convertDbProfile } from '@/lib/utils/profile-utils'
import { validateAndSanitizeFile } from '@/middleware/security/sanitize'
import { getOptimizedImageUrl, parseSupabaseStorageUrl, AVATAR_SIZES } from '@/lib/utils/image-utils'
import { AVATAR_VALIDATION } from '@/lib/validators/profile'
import type { Profile, ProfileUpdate } from '@/types/profile.types'

/**
 * Supabase storage bucket name for avatar images.
 * @constant
 */
const PROFILE_BUCKET = 'avatars'

/**
 * Abstract base profile service with shared business logic.
 * Contains all profile-related operations that work identically on client and server.
 *
 * @remarks
 * Must be extended by concrete implementations:
 * - ProfileClientService (for client-side usage)
 * - ProfileServerService (for server-side usage)
 *
 * **Features**:
 * - Type-safe profile operations
 * - Automatic data conversion (DB ↔ App formats)
 * - Avatar upload with validation
 * - Image optimization and transformation
 * - Comprehensive error handling
 * - Detailed logging
 *
 * @example
 * ```typescript
 * // Server-side implementation
 * class ProfileServerService extends ProfileService {
 *   // Inherits all methods
 * }
 *
 * const service = new ProfileServerService(client, logger, errorHandler)
 * const profile = await service.getProfile(userId)
 * ```
 */
export abstract class ProfileService extends BaseService {
  /**
   * Get a user's profile by ID.
   * Retrieves complete profile data including avatar URL.
   *
   * @param userId - The user ID to fetch profile for
   * @returns The user's profile with all fields populated
   * @throws {AppError} If profile not found or fetch fails
   *
   * @remarks
   * - Returns null if profile doesn't exist
   * - Automatically converts database types to application format
   * - Includes avatar URL if set
   *
   * @example
   * ```typescript
   * const profile = await service.getProfile(userId)
   * if (profile) {
   *   console.log(`Hello, ${profile.display_name}!`)
   *   console.log(`Email: ${profile.email}`)
   *   console.log(`Avatar: ${profile.avatar_url}`)
   * }
   * ```
   */
  async getProfile(userId: string): Promise<Profile | null> {
    try {
      this.logger.debug({ userId }, 'Fetching user profile')
      const { data, error } = await this.client.from('profiles').select('*').eq('id', userId).single()

      if (error) throw error

      this.logger.info({ userId, profileId: data?.id }, 'Profile retrieved successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'fetch profile', { userId })
    }
  }

  /**
   * Create a new profile for a user.
   * Handles partial data by applying defaults for missing fields.
   *
   * @param userId - The user ID (should match auth user ID)
   * @param profileData - The profile data (can be partial, missing fields get defaults)
   * @returns The created profile with all fields populated
   * @throws {AppError} If profile creation fails
   *
   * @remarks
   * - Automatically converts application types to database format
   * - Applies default values for optional fields
   * - Validates required fields (email, display_name)
   *
   * @example
   * ```typescript
   * const profile = await service.createProfile(userId, {
   *   email: 'user@example.com',
   *   display_name: 'John Doe',
   *   bio: 'Software developer'
   * });
   * ```
   */
  async createProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    try {
      this.logger.debug({ userId, profileData }, 'Creating user profile')
      const dbData = convertAppProfileForInsert(profileData)

      const { data, error } = await this.client
        .from('profiles')
        .insert({ id: userId, ...dbData })
        .select()
        .single()

      if (error) throw error

      this.logger.info({ userId, profileId: data.id }, 'Profile created successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'create profile', { userId })
    }
  }

  /**
   * Update user profile with partial data.
   * Only updates fields provided in the updates object.
   *
   * @param userId - The user ID whose profile to update
   * @param updates - Partial profile data to update (all fields optional)
   * @returns The updated profile with all fields
   * @throws {AppError} If profile update fails
   *
   * @remarks
   * - Only provided fields are updated
   * - Automatically converts application types to database format
   * - Returns complete profile after update
   * - Validates data before update
   *
   * @example
   * ```typescript
   * // Update only bio and location
   * const updated = await service.updateProfile(userId, {
   *   bio: 'New bio text',
   *   location: 'San Francisco, CA'
   * });
   *
   * // Update display name
   * const updated = await service.updateProfile(userId, {
   *   display_name: 'Jane Smith'
   * });
   * ```
   */
  async updateProfile(userId: string, updates: Partial<ProfileUpdate>): Promise<Profile> {
    try {
      this.logger.debug({ userId, updates }, 'Updating profile')
      const dbData = convertAppProfileForUpdate(updates)

      const { data, error } = await this.client.from('profiles').update(dbData).eq('id', userId).select().single()

      if (error) throw error

      this.logger.info({ userId, profileId: data.id }, 'Profile updated successfully')
      return convertDbProfile(data)
    } catch (error) {
      return this.handleError(error, 'update profile', { userId })
    }
  }

  /**
   * Upload and validate a profile avatar image.
   * Handles file validation, upload, optimization, and profile update.
   *
   * @param userId - The user ID who owns the avatar
   * @param file - The image file to upload (File object)
   * @returns The optimized avatar URL (medium size, 200x200)
   * @throws {AppError} If validation fails, upload fails, or profile update fails
   *
   * @remarks
   * **Upload Process**:
   * 1. Validates file (size, type, extension)
   * 2. Sanitizes filename
   * 3. Uploads to Supabase Storage
   * 4. Generates optimized URL (200x200 WebP)
   * 5. Updates profile with new avatar URL
   * 6. On failure, attempts to clean up uploaded file
   *
   * **Validation Rules**:
   * - Max size: 5MB
   * - Allowed types: JPEG, PNG, WebP, GIF
   * - Automatic filename collision prevention
   *
   * **Security**:
   * - File content validation
   * - Filename sanitization
   * - MIME type verification
   *
   * @example
   * ```typescript
   * const fileInput = document.querySelector('input[type="file"]')
   * const file = fileInput.files[0]
   * const avatarUrl = await service.uploadAvatar(userId, file)
   * console.log('Avatar uploaded:', avatarUrl)
   * ```
   */
  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      this.logger.debug({ userId, fileName: file.name }, 'Uploading avatar')

      // Server-side validation - convert readonly arrays to mutable for validateAndSanitizeFile
      const validation = validateAndSanitizeFile(file, {
        maxSize: AVATAR_VALIDATION.maxSize,
        allowedTypes: [...AVATAR_VALIDATION.allowedTypes],
        allowedExtensions: [...AVATAR_VALIDATION.allowedExtensions],
      })

      if (!validation.isValid) {
        this.logger.warn({ userId, fileName: file.name, error: validation.error }, 'Avatar validation failed')
        throw new Error(validation.error || 'Invalid file')
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
      const { error: uploadError } = await this.client.storage.from(PROFILE_BUCKET).upload(filePath, file, {
        cacheControl: '3600',
        upsert: false, // Don't overwrite existing files
      })

      if (uploadError) throw uploadError

      // Generate optimized image URL using Supabase Transform
      // This uses the medium size (200x200) as the primary avatar URL
      const optimizedUrl = getOptimizedImageUrl(this.client, PROFILE_BUCKET, filePath, AVATAR_SIZES.medium)

      // Transaction-like behavior: Update profile with optimized avatar URL
      // If this fails, the uploaded file remains in storage (orphaned)
      // Consider implementing cleanup job for orphaned files
      try {
        await this.updateProfile(userId, { avatar_url: optimizedUrl })
      } catch (updateError) {
        // Attempt to clean up uploaded file on profile update failure
        await this.client.storage.from(PROFILE_BUCKET).remove([filePath])
        throw updateError
      }

      this.logger.info({ userId, optimizedUrl, filePath }, 'Avatar uploaded successfully with optimization')
      return optimizedUrl
    } catch (error) {
      return this.handleError(error, 'upload avatar', { userId })
    }
  }

  /**
   * Get optimized avatar URLs for different sizes
   * Useful for responsive images or different UI contexts
   *
   * @param avatarUrl - The stored avatar URL (can be optimized or base URL)
   * @returns Object with URLs for different sizes, or null if no avatar
   *
   * @example
   * ```typescript
   * const urls = await service.getOptimizedAvatarUrls(profile.avatar_url)
   * if (urls) {
   *   console.log(urls.thumbnail) // 50x50
   *   console.log(urls.medium)    // 200x200
   *   console.log(urls.large)     // 400x400
   * }
   * ```
   */
  getOptimizedAvatarUrls(
    avatarUrl: string | null
  ): { thumbnail: string; small: string; medium: string; large: string } | null {
    if (!avatarUrl) return null

    // Use shared utility to parse the URL
    const pathInfo = parseSupabaseStorageUrl(avatarUrl)

    if (!pathInfo) {
      // URL doesn't match expected pattern, return as-is for all sizes
      return {
        thumbnail: avatarUrl,
        small: avatarUrl,
        medium: avatarUrl,
        large: avatarUrl,
      }
    }

    const { bucket, filePath } = pathInfo

    return {
      thumbnail: getOptimizedImageUrl(this.client, bucket, filePath, AVATAR_SIZES.thumbnail),
      small: getOptimizedImageUrl(this.client, bucket, filePath, AVATAR_SIZES.small),
      medium: getOptimizedImageUrl(this.client, bucket, filePath, AVATAR_SIZES.medium),
      large: getOptimizedImageUrl(this.client, bucket, filePath, AVATAR_SIZES.large),
    }
  }
}
