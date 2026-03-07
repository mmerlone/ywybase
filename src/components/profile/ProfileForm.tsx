'use client'

import { Box, Button, CircularProgress, Grid, Paper, Tab, Tabs } from '@mui/material'
import { useCurrentUser } from '@/components/providers/AuthProvider'
import { useCallback, useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { ProfileSkeleton } from './ProfileSkeleton'

import { TabAccount } from './TabAccount'
import { TabProfile } from './TabProfile'
import { TabSocialLinks } from './TabSocialLinks'
import { UserCard } from './UserCard'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { useProfile } from '@/hooks/useProfile'
import { logger } from '@/lib/logger/client'
import { formatBoolean, formatDate, normalizeString } from '@/lib/utils/string-utils'
import { createSafeResolver } from '@/lib/utils/forms'
import { type ProfileFormValues, profileFormSchema } from '@/lib/validators/profile'
import type { GenderPreference, Profile, ProfileUpdate } from '@/types/profile.types'
import { ThemePreferenceEnum } from '@/types/theme.types'

/**
 * Transform profile data to match ProfileFormValues type.
 * Pure helper function with no external dependencies.
 *
 * @param profileData - Profile data from database
 * @param userEmail - User's email address
 * @returns Transformed profile form values or null if no profile data
 */
function transformToFormValues(profileData: Profile | null, userEmail: string): ProfileFormValues | null {
  if (!profileData) return null

  return {
    email: userEmail,
    display_name: profileData.display_name ?? '',
    first_name: normalizeString(profileData.first_name),
    last_name: normalizeString(profileData.last_name),
    bio: normalizeString(profileData.bio),
    company: normalizeString(profileData.company),
    job_title: normalizeString(profileData.job_title),
    website: normalizeString(profileData.website),
    phone: normalizeString(profileData.phone),
    timezone: normalizeString(profileData.timezone),
    country_code: normalizeString(profileData.country_code),
    state: normalizeString(profileData.state),
    city: normalizeString(profileData.city),
    locale: normalizeString(profileData.locale),
    birth_date: profileData.birth_date ?? null,
    gender: (profileData.gender as GenderPreference) ?? null,
    theme: profileData.theme,
  }
}

interface ProfileFormProps {
  profile: Profile | null
}

export function ProfileForm({ profile: initialProfile }: ProfileFormProps): JSX.Element {
  const { showError, showSuccess } = useSnackbar()
  const { user: authUser } = useCurrentUser()
  const { profile, updateProfile, isLoading } = useProfile(authUser?.id, initialProfile)
  const [activeTab, setActiveTab] = useState(0)

  const form = useForm<ProfileFormValues>({
    resolver: createSafeResolver(profileFormSchema),
    mode: 'onBlur',
    defaultValues: initialProfile
      ? {
          email: authUser?.email ?? '',
          display_name: initialProfile.display_name ?? '',
          first_name: normalizeString(initialProfile.first_name),
          last_name: normalizeString(initialProfile.last_name),
          bio: normalizeString(initialProfile.bio),
          company: normalizeString(initialProfile.company),
          job_title: normalizeString(initialProfile.job_title),
          website: normalizeString(initialProfile.website),
          phone: normalizeString(initialProfile.phone),
          timezone: normalizeString(initialProfile.timezone),
          country_code: normalizeString(initialProfile.country_code),
          state: normalizeString(initialProfile.state),
          city: normalizeString(initialProfile.city),
          locale: normalizeString(initialProfile.locale),
          birth_date: initialProfile.birth_date ?? null,
          gender: (initialProfile.gender as GenderPreference) ?? null,
          theme: initialProfile.theme,
        }
      : {
          email: authUser?.email ?? '',
          display_name: '',
          first_name: '',
          last_name: '',
          bio: '',
          company: '',
          job_title: '',
          website: '',
          phone: '',
          timezone: '',
          country_code: '',
          state: '',
          city: '',
          locale: '',
          birth_date: null,
          gender: null,
          theme: ThemePreferenceEnum.SYSTEM,
        },
  })

  const { reset, handleSubmit, formState } = form
  const { errors, isDirty, isSubmitting, isValid } = formState

  // Reset form when profile data loads (only if form is not dirty and not submitting)
  // This handles cases where profile data updates after initial load
  useEffect(() => {
    if (profile && !isDirty && !isSubmitting && !isLoading) {
      const formValues = transformToFormValues(profile, authUser?.email ?? '')
      if (formValues) {
        reset(formValues, { keepDirty: false, keepErrors: false })
      }
    }
  }, [profile, authUser?.email, reset, isDirty, isSubmitting, isLoading])

  const onSubmit = useCallback(
    async (data: ProfileFormValues, event?: React.BaseSyntheticEvent) => {
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      if (!authUser?.id) return

      try {
        const updates: ProfileUpdate = {
          first_name: data.first_name ?? null,
          last_name: data.last_name ?? null,
          display_name: data.display_name ?? '',
          bio: data.bio ?? null,
          company: data.company ?? null,
          job_title: data.job_title ?? null,
          website: data.website ?? null,
          phone: data.phone ?? null,
          timezone: data.timezone ?? null,
          country_code: data.country_code ?? null,
          state: data.state ?? null,
          city: data.city ?? null,
          locale: data.locale ?? null,
          birth_date: data.birth_date ?? null,
          gender: data.gender ?? null,
          theme: data.theme,
        }

        const result = await updateProfile(updates)

        if (!result) {
          throw new Error('Profile update failed without error')
        }

        showSuccess('Profile updated successfully!')
        // Reset form with submitted data only on successful update
        // This disables the submit button until user makes changes
        reset(data, { keepDirty: false, keepErrors: false })
      } catch (error: unknown) {
        const err = error instanceof Error ? error : new Error('Unknown error occurred')
        logger.error(
          {
            error: err.message,
            component: 'ProfileForm',
            action: 'updateProfile',
            stack: err.stack,
            userId: authUser?.id,
          },
          'Profile update error'
        )
        showError(err.message ?? 'Failed to update profile. Please try again.')
        // Don't reset form on error to preserve user input
      }
    },
    [authUser?.id, updateProfile, showSuccess, showError, reset]
  )

  // Show unified skeleton only during initial load if no server data is available
  if (isLoading && !initialProfile) {
    return <ProfileSkeleton />
  }

  const resolvedProfile = profile ?? initialProfile

  return (
    <Box sx={{ mt: 1, width: '100%' }}>
      <Grid container spacing={3} sx={{ position: 'relative' }}>
        {/* Left Column - Avatar and Basic Info */}
        <Grid
          size={{ xs: 12, md: 4 }}
          sx={{
            position: { xs: 'static', md: 'sticky' },
            top: 0,
            height: 'fit-content',
            transition: 'top 0.3s',
            alignSelf: 'flex-start',
            zIndex: 1,
          }}>
          <Paper
            id="profile-avatar"
            sx={{
              p: 3,
              position: 'relative',
              overflow: 'visible',
            }}>
            <UserCard
              profile={resolvedProfile}
              formatDate={formatDate}
              formatBoolean={formatBoolean}
              avatarForm={true}
              avatarSize="lg"
              userId={authUser?.id}
            />
          </Paper>
        </Grid>

        {/* Right Column - Form Sections */}
        <Grid size={{ xs: 12, md: 8 }}>
          <FormProvider {...form}>
            <Paper sx={{ p: 4 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="profile tabs">
                  <Tab label="Profile" id="profile-tab-0" aria-controls="profile-tabpanel-0" />
                  <Tab label="Social" id="profile-tab-1" aria-controls="profile-tabpanel-1" />
                  <Tab label="Account" id="profile-tab-2" aria-controls="profile-tabpanel-2" />
                </Tabs>
              </Box>

              <Box role="tabpanel" hidden={activeTab !== 0} id="profile-tabpanel-0" aria-labelledby="profile-tab-0">
                {activeTab === 0 && (
                  <Box
                    component="form"
                    onSubmit={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      void handleSubmit(onSubmit)(e).catch(() => {})
                    }}
                    noValidate
                    sx={{ width: '100%' }}>
                    <TabProfile errors={errors} disabled={isSubmitting || isLoading} />

                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4, gap: 2 }}>
                      <Button
                        fullWidth
                        type="button"
                        variant="outlined"
                        onClick={() => reset()}
                        disabled={!isDirty || isSubmitting || isLoading}
                        sx={{ mt: 3, mb: 2 }}>
                        Reset
                      </Button>
                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={!isDirty || isSubmitting || !isValid || isLoading}
                        sx={{ mt: 3, mb: 2 }}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : undefined}>
                        {isSubmitting ? 'Updating...' : 'Update Profile'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>

              <Box role="tabpanel" hidden={activeTab !== 1} id="profile-tabpanel-1" aria-labelledby="profile-tab-1">
                {activeTab === 1 && <TabSocialLinks />}
              </Box>

              <Box role="tabpanel" hidden={activeTab !== 2} id="profile-tabpanel-2" aria-labelledby="profile-tab-2">
                {activeTab === 2 && <TabAccount />}
              </Box>
            </Paper>
          </FormProvider>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfileForm
