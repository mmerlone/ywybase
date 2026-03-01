import test from 'node:test'
import assert from 'node:assert/strict'

import {
  convertDbProfile,
  convertAppProfileForInsert,
  convertAppProfileForUpdate,
  DEFAULT_PRIVACY_SETTINGS,
} from '@/lib/utils/profile-utils'
import type { DbProfile } from '@/types/database'
import {
  type PrivacySettings,
  type Profile,
  GenderPreferenceEnum,
  NotificationPreferencesEnum,
} from '@/types/profile.types'

const baseDbProfile: DbProfile = {
  id: 'user-123',
  email: 'user@example.com',
  display_name: 'Example User',
  avatar_url: null,
  bio: null,
  birth_date: null,
  city: null,
  company: null,
  country_code: null,
  first_name: null,
  gender: null,
  is_onboarded: false,
  job_title: null,
  last_name: null,
  locale: null,
  notification_preferences: null,
  banned_until: null,
  confirmed_at: '2024-01-01T00:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  last_sign_in_at: '2024-01-01T00:00:00Z',
  providers: ['email'],
  phone: null,
  privacy_settings: null,
  role: 'user',
  social_links: null,
  state: null,
  status: 'active',
  theme: 'light',
  timezone: null,
  updated_at: '2026-01-18T00:00:00.000Z',
  website: null,
}

test('convertDbProfile applies defaults to nullable JSON fields', () => {
  const profile = convertDbProfile(baseDbProfile)

  assert.deepStrictEqual(profile.privacy_settings, DEFAULT_PRIVACY_SETTINGS)
  assert.strictEqual(profile.gender, null)
  assert.strictEqual(profile.notification_preferences, null)
  assert.deepStrictEqual(profile.social_links, [])
})

test('convertAppProfileForInsert serializes complex fields and pads required values', () => {
  const privacy: PrivacySettings = {
    data_sharing: {
      analytics: true,
      marketing: false,
      third_parties: false,
    },
    communication_preferences: {
      email: true,
      push: true,
      sms: false,
    },
  }

  const profileInput: Partial<Profile> = {
    email: 'insert@example.com',
    display_name: 'Insert User',
    privacy_settings: privacy,
    gender: GenderPreferenceEnum.NON_BINARY,
    notification_preferences: NotificationPreferencesEnum.EMAIL,
    social_links: [{ id: 'gh', url: 'https://github.com/example', title: 'GitHub' }],
    bio: 'Hello world',
  }

  const result = convertAppProfileForInsert(profileInput)

  let parsedPrivacy: unknown
  try {
    parsedPrivacy = JSON.parse(result.privacy_settings as string)
  } catch (error) {
    assert.fail(`Failed to parse privacy settings: ${error}`)
  }

  assert.equal(result.display_name, 'Insert User')
  assert.equal(result.email, 'insert@example.com')
  assert.equal(result.gender, GenderPreferenceEnum.NON_BINARY)
  assert.equal(result.notification_preferences, NotificationPreferencesEnum.EMAIL)
  assert.deepStrictEqual(result.social_links, profileInput.social_links)
  assert.deepStrictEqual(parsedPrivacy, privacy)
})

test('convertAppProfileForUpdate only serializes provided fields', () => {
  const updateInput: Partial<Profile> = {
    bio: 'Updated bio',
    privacy_settings: DEFAULT_PRIVACY_SETTINGS,
    notification_preferences: NotificationPreferencesEnum.PUSH,
  }

  const result = convertAppProfileForUpdate(updateInput)

  assert.equal(result.bio, 'Updated bio')
  assert.equal(result.notification_preferences, NotificationPreferencesEnum.PUSH)

  let parsedPrivacyUpdate: unknown
  try {
    parsedPrivacyUpdate = JSON.parse(result.privacy_settings as string)
  } catch (error) {
    assert.fail(`Failed to parse privacy settings: ${error}`)
  }
  assert.deepStrictEqual(parsedPrivacyUpdate, DEFAULT_PRIVACY_SETTINGS)

  const optionalUnset = convertAppProfileForUpdate({ bio: 'Only bio updated' })
  assert.equal(optionalUnset.bio, 'Only bio updated')
  assert.equal(optionalUnset.privacy_settings, undefined)
  assert.equal(optionalUnset.notification_preferences, undefined)
})
