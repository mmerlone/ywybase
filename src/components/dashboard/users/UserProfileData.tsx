'use client'

import React from 'react'
import { Box, Chip, Divider, Grid, Paper, Stack, Tooltip, Typography } from '@mui/material'
import {
  Cake as BirthdayIcon,
  Cancel as NoIcon,
  CheckCircle as YesIcon,
  Notifications as NotificationsIcon,
  Palette as ThemeIcon,
  Schedule as TimezoneIcon,
  Translate as LocaleIcon,
} from '@mui/icons-material'
import { formatInTimeZone } from 'date-fns-tz'

import { SocialLinks } from '@/components/dashboard/users/SocialLinks'
import { Phone } from '@/components/common/Phone'
import { TzClockDateUx } from '@/components/common/TzClockDateUx'
import { formatText } from '@/lib/utils/string-utils'
import { formatTimezoneOffset } from '@/lib/utils/timezone'
import type { Profile, SocialLink } from '@/types/profile.types'

interface UserProfileDataProps {
  profile: Profile
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

/**
 * Get zodiac sign info based on birth date.
 */
function getZodiacInfo(birthDate: string): { symbol: string; name: string } {
  const date = new Date(birthDate)
  const month = date.getMonth() + 1
  const day = date.getDate()

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return { symbol: '♈', name: 'Aries' }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return { symbol: '♉', name: 'Taurus' }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return { symbol: '♊', name: 'Gemini' }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return { symbol: '♋', name: 'Cancer' }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return { symbol: '♌', name: 'Leo' }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return { symbol: '♍', name: 'Virgo' }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return { symbol: '♎', name: 'Libra' }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return { symbol: '♏', name: 'Scorpio' }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return { symbol: '♐', name: 'Sagittarius' }
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return { symbol: '♑', name: 'Capricorn' }
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return { symbol: '♒', name: 'Aquarius' }
  return { symbol: '♓', name: 'Pisces' }
}

export function UserProfileData({ profile }: UserProfileDataProps): JSX.Element {
  const communicationPreferences = profile.privacy_settings?.communication_preferences
  const dataSharingPreferences = profile.privacy_settings?.data_sharing
  const socialLinks: SocialLink[] = profile.social_links ?? []

  const detailSections: Array<{
    title: string
    fields: Array<{ label: string; value: React.ReactNode }>
  }> = [
    {
      title: 'Personal Details',
      fields: [
        { label: 'First Name', value: formatText(profile.first_name) },
        { label: 'Last Name', value: formatText(profile.last_name) },
        {
          label: 'Phone',
          value: <Phone phone={profile.phone} showFlag showLink />,
        },
        {
          label: 'Birth Date',
          value: profile.birth_date ? (
            <Stack direction="row" spacing={1} alignItems="center">
              <BirthdayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body1">{formatInTimeZone(new Date(profile.birth_date), 'UTC', 'PP')}</Typography>
              {((): React.ReactNode => {
                const zodiacInfo = getZodiacInfo(profile.birth_date)
                return (
                  <Tooltip title={`Zodiac sign: ${zodiacInfo.name}`}>
                    <Typography
                      variant="body1"
                      aria-label={zodiacInfo.name}
                      sx={{
                        fontSize: 20,
                        cursor: 'help',
                        '&:hover': { transform: 'scale(1.1)' },
                        transition: 'transform 0.2s ease',
                      }}>
                      {zodiacInfo.symbol}
                    </Typography>
                  </Tooltip>
                )
              })()}
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
        {
          label: 'Timezone',
          value: profile.timezone ? (
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <TimezoneIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body1">{profile.timezone}</Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                UTC{formatTimezoneOffset(profile.timezone)}
              </Typography>
              <TzClockDateUx timezone={profile.timezone} showDate={true} />
            </Stack>
          ) : (
            '-'
          ),
        },
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
            <Grid size={{ xs: 12, sm: 6 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  Email Verified:
                </Typography>
                {profile.confirmed_at ? (
                  <YesIcon sx={{ fontSize: 18, color: 'success.main' }} />
                ) : (
                  <NoIcon sx={{ fontSize: 18, color: 'error.main' }} />
                )}
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {profile.confirmed_at ? 'Yes' : 'No'}
                </Typography>
              </Stack>
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
        <Divider />
        <SocialLinks
          socialLinks={socialLinks}
          userAvatarUrl={profile.avatar_url}
          userEmail={profile.email}
          userDisplayName={profile.display_name}
        />
      </Stack>
    </Paper>
  )
}
