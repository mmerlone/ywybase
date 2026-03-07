'use client'

import React from 'react'
import { Box, Chip, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import {
  Translate as LocaleIcon,
  Palette as ThemeIcon,
  Notifications as NotificationsIcon,
  Cake as BirthdayIcon,
  CheckCircle as YesIcon,
  Cancel as NoIcon,
} from '@mui/icons-material'
import type { Profile } from '@/types/profile.types'

interface UserProfileDataProps {
  profile: Profile
  formatDate: (date: string | null | undefined) => string
  formatText: (value?: string | null) => string
}

/**
 * Reusable component for Privacy & Communication sub-sections
 */
function PrivacySubSection({ items }: { items: Array<{ label: string; value: boolean | undefined }> }): JSX.Element {
  return (
    <Box component="ul" sx={{ m: 0, pl: 3, listStyle: 'disc' }}>
      {items.map((item) => (
        <Box component="li" key={item.label} sx={{ display: 'list-item', mb: 0.5 }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="body2">{item.label}:</Typography>
            {item.value ? (
              <YesIcon sx={{ fontSize: 18, color: 'success.main' }} />
            ) : (
              <NoIcon sx={{ fontSize: 18, color: 'error.main' }} />
            )}
          </Stack>
        </Box>
      ))}
    </Box>
  )
}

export function UserProfileData({ profile, formatDate, formatText }: UserProfileDataProps): JSX.Element {
  const communicationPreferences = profile.privacy_settings?.communication_preferences
  const dataSharingPreferences = profile.privacy_settings?.data_sharing

  const detailSections: Array<{
    title: string
    fields: Array<{ label: string; value: React.ReactNode }>
  }> = [
    {
      title: 'Personal Details',
      fields: [
        { label: 'First Name', value: formatText(profile.first_name) },
        { label: 'Last Name', value: formatText(profile.last_name) },
        { label: 'Display Name', value: formatText(profile.display_name) },
        { label: 'Email', value: profile.email },
        { label: 'Phone', value: formatText(profile.phone) },
        {
          label: 'Birth Date',
          value: profile.birth_date ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <BirthdayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1">{formatDate(profile.birth_date)}</Typography>
            </Stack>
          ) : (
            '-'
          ),
        },
      ],
    },
    {
      title: 'Professional & Location',
      fields: [
        { label: 'Company', value: formatText(profile.company) },
        { label: 'Job Title', value: formatText(profile.job_title) },
        { label: 'Country', value: formatText(profile.country_code) },
        { label: 'State / Region', value: formatText(profile.state) },
        { label: 'City', value: formatText(profile.city) },
        { label: 'Timezone', value: formatText(profile.timezone) },
      ],
    },
    {
      title: 'Preferences & Locale',
      fields: [
        {
          label: 'Locale',
          value: (
            <Stack direction="row" spacing={1} alignItems="center">
              <LocaleIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1">{formatText(profile.locale)}</Typography>
            </Stack>
          ),
        },
        {
          label: 'Theme',
          value: (
            <Stack direction="row" spacing={1} alignItems="center">
              <ThemeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Chip
                label={formatText(profile.theme)}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Stack>
          ),
        },
        {
          label: 'Notifications',
          value: (
            <Stack direction="row" spacing={1} alignItems="center">
              <NotificationsIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1">{formatText(profile.notification_preferences)}</Typography>
            </Stack>
          ),
        },
      ],
    },
    {
      title: 'Privacy & Communication',
      fields: [
        {
          label: 'Data Sharing',
          value: dataSharingPreferences ? (
            <PrivacySubSection
              items={[
                { label: 'Analytics', value: dataSharingPreferences.analytics },
                { label: 'Third Parties', value: dataSharingPreferences.third_parties },
                { label: 'Marketing', value: dataSharingPreferences.marketing },
              ]}
            />
          ) : (
            '-'
          ),
        },
        {
          label: 'Communication Channels',
          value: communicationPreferences ? (
            <PrivacySubSection
              items={[
                { label: 'Email', value: communicationPreferences.email },
                { label: 'Push', value: communicationPreferences.push },
                { label: 'SMS', value: communicationPreferences.sms },
              ]}
            />
          ) : (
            '-'
          ),
        },
      ],
    },
  ]

  return (
    <Paper sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'divider', boxShadow: 0 }}>
      <Stack spacing={4}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
            Account Information
          </Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Created At
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatDate(profile.created_at)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Last Sign In
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {formatDate(profile.last_sign_in_at)}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                Email Verified
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600 }}>
                {profile.confirmed_at ? 'Yes' : 'No'}
              </Typography>
            </Grid>
          </Grid>
        </Box>

        {detailSections.map((section) => (
          <React.Fragment key={section.title}>
            <Divider />
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                {section.title}
              </Typography>
              <Grid container spacing={2}>
                {section.fields.map((field) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={field.label}>
                    <Typography variant="body2" color="text.secondary">
                      {field.label}
                    </Typography>
                    <Typography variant="body1" component="div" sx={{ fontWeight: 600 }}>
                      {field.value}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </React.Fragment>
        ))}
      </Stack>
    </Paper>
  )
}
