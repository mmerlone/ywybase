'use client'

import { Cookie as CookieIcon, Refresh as RefreshIcon } from '@mui/icons-material'
import { Box, Button, Divider, FormControlLabel, FormGroup, Paper, Skeleton, Switch, Typography } from '@mui/material'
import React, { Suspense, useRef, useState } from 'react'

import { useSnackbar } from '@/contexts/SnackbarContext'
import { useCookieConsent } from '@/hooks/useCookieConsent'
import { CookiePreferences } from '@/types/cookie.types'

function CookieSettingsContent(): JSX.Element {
  const { hasConsent, preferences, acceptSelected, decline, isLoading } = useCookieConsent()
  const [isDirty, setIsDirty] = useState(false)
  const { showSuccess, showError } = useSnackbar()
  const saveButtonRef = useRef<HTMLButtonElement>(null)
  const resetButtonRef = useRef<HTMLButtonElement>(null)

  // Track previous preferences to detect when external state (localStorage) changes
  const [prevPreferences, setPrevPreferences] = useState(preferences)
  const [localPreferences, setLocalPreferences] = useState(preferences)

  // Adjust state during render (not in effect) - React docs approved pattern
  // Only sync when external state changes AND user hasn't made local edits
  if (preferences !== prevPreferences && !isDirty) {
    setPrevPreferences(preferences)
    setLocalPreferences(preferences)
  }

  const handleSavePreferences = async (): Promise<void> => {
    try {
      await acceptSelected(localPreferences)
      setIsDirty(false)
      // Blur button before showing snackbar to prevent aria-hidden focus issue
      saveButtonRef.current?.blur()
      showSuccess('Cookie preferences saved successfully')
    } catch {
      showError('Failed to save cookie preferences')
    }
  }

  const handlePreferenceChange =
    (category: keyof CookiePreferences) =>
    (event: React.ChangeEvent<HTMLInputElement>): void => {
      if (category === 'necessary') return // Cannot disable necessary cookies
      setIsDirty(true)
      setLocalPreferences((prev) => ({
        ...prev,
        [category]: event.target.checked,
      }))
    }

  const handleResetConsent = (): void => {
    try {
      decline()
      // Reset local preferences to default values (all false except necessary)
      setLocalPreferences({
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      })
      setIsDirty(false)
      // Blur button before showing snackbar to prevent aria-hidden focus issue
      resetButtonRef.current?.blur()
      showSuccess('Cookie preferences have been reset.')
    } catch {
      showError('Failed to reset cookie preferences.')
    }
  }

  // Show loading skeleton while data loads
  if (isLoading) {
    return (
      <Box aria-busy="true" aria-live="polite">
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 3 }} />

        <Divider sx={{ my: 3 }} />

        <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
        {[1, 2, 3, 4].map((i) => (
          <Box key={i} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={80} />
          </Box>
        ))}

        <Divider sx={{ my: 3 }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Skeleton variant="rectangular" width={150} height={36} />
          <Skeleton variant="rectangular" width={150} height={36} />
        </Box>
      </Box>
    )
  }

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Current Status
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Cookies are currently <strong>{hasConsent ? 'accepted' : 'declined'}</strong>.
      </Typography>

      <Divider sx={{ my: 3 }} />

      <Typography variant="h6" gutterBottom>
        Cookie Categories
      </Typography>

      <FormGroup sx={{ mb: 3 }}>
        <FormControlLabel
          control={<Switch checked={localPreferences.necessary} disabled />}
          label={
            <Box>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                Necessary Cookies
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary">
                These cookies are essential for the website to function properly and cannot be disabled. They are
                usually only set in response to actions made by you which amount to a request for services, such as
                setting your privacy preferences, logging in, or filling in forms.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', mb: 2 }}
        />

        <FormControlLabel
          control={<Switch checked={localPreferences.analytics} onChange={handlePreferenceChange('analytics')} />}
          label={
            <Box>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                Analytics Cookies
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary">
                These cookies allow us to count visits and traffic sources so we can measure and improve the performance
                of our site. They help us to know which pages are the most and least popular and see how visitors move
                around the site.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', mb: 2 }}
        />

        <FormControlLabel
          control={<Switch checked={localPreferences.marketing} onChange={handlePreferenceChange('marketing')} />}
          label={
            <Box>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                Marketing Cookies
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary">
                These cookies may be set through our site by our advertising partners. They may be used by those
                companies to build a profile of your interests and show you relevant adverts on other sites.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start', mb: 2 }}
        />

        <FormControlLabel
          control={<Switch checked={localPreferences.functional} onChange={handlePreferenceChange('functional')} />}
          label={
            <Box>
              <Typography variant="body1" component="span" sx={{ fontWeight: 500 }}>
                Functional Cookies
              </Typography>
              <Typography variant="body2" display="block" color="text.secondary">
                These cookies enable the website to provide enhanced functionality and personalization. They may be set
                by us or by third party providers whose services we have added to our pages.
              </Typography>
            </Box>
          }
          sx={{ alignItems: 'flex-start' }}
        />
      </FormGroup>

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Button ref={saveButtonRef} variant="contained" onClick={handleSavePreferences} disabled={!isDirty}>
          {isDirty ? 'Save Preferences' : 'Saved'}
        </Button>
        <Button ref={resetButtonRef} variant="outlined" startIcon={<RefreshIcon />} onClick={handleResetConsent}>
          Reset All Cookies
        </Button>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Changes will take effect immediately. You may need to refresh the page to see some changes.
      </Typography>
    </>
  )
}

export function CookieSettings(): JSX.Element {
  return (
    <Paper sx={{ p: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <CookieIcon color="primary" />
        <Typography variant="h5" component="h2">
          Cookie Settings
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your cookie preferences below. You can enable or disable different types of cookies based on your
        preferences. Note that disabling some cookies may affect your experience on our website.
      </Typography>

      <Suspense>
        <CookieSettingsContent />
      </Suspense>
    </Paper>
  )
}
