/**
 * Social OG metadata utilities.
 *
 * Provides helpers to derive Open Graph metadata from raw metadata payloads.
 */

import type { SocialOgMeta, SocialPlatformConfig, SocialProviderRawMeta } from '@/config/social'

/**
 * Returns the first string value found for the provided keys.
 *
 * @param rawMeta - Raw provider metadata
 * @param keys - Keys to check in order
 * @returns First non-empty string found or undefined
 */
export function getMetaString(rawMeta: SocialProviderRawMeta, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = rawMeta[key]
    if (typeof value === 'string' && value.trim() !== '') {
      return value
    }
  }
  return undefined
}

/**
 * Normalizes OG metadata and returns null if no fields are present.
 *
 * @param meta - Candidate OG metadata
 * @returns Sanitized metadata or null if empty
 */
export function buildOgMeta(meta: SocialOgMeta): SocialOgMeta | null {
  if (!meta.title && !meta.description && !meta.image) return null
  return meta
}

/**
 * Derives OG metadata based on platform config mapping rules.
 *
 * @param platform - Social platform config
 * @param rawMeta - Raw metadata payload
 * @returns OG metadata or null if not available
 */
export function getOgMetaFromMapping(
  platform: SocialPlatformConfig,
  rawMeta: SocialProviderRawMeta
): SocialOgMeta | null {
  const mapping = platform.ogMapping
  if (!mapping) return null

  const firstName = mapping.nameParts?.firstKeys ? getMetaString(rawMeta, mapping.nameParts.firstKeys) : undefined
  const lastName = mapping.nameParts?.lastKeys ? getMetaString(rawMeta, mapping.nameParts.lastKeys) : undefined

  const composedName = [firstName, lastName].filter(Boolean).join(' ')
  const titleFromKeys = mapping.titleKeys ? getMetaString(rawMeta, mapping.titleKeys) : undefined

  const title = composedName || titleFromKeys
  const description = mapping.descriptionKeys ? getMetaString(rawMeta, mapping.descriptionKeys) : undefined
  const image = mapping.imageKeys ? getMetaString(rawMeta, mapping.imageKeys) : undefined

  return buildOgMeta({ title, description, image })
}

/**
 * Derives OG metadata for a connected auth provider based on platform config mapping rules.
 *
 * @param platform - Social platform config
 * @param rawMeta - Provider raw_user_meta_data
 * @returns OG metadata or null if not available
 */
export function getOgMetaFromAuth(platform: SocialPlatformConfig, rawMeta: SocialProviderRawMeta): SocialOgMeta | null {
  return getOgMetaFromMapping(platform, rawMeta)
}
