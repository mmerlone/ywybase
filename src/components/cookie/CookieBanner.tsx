'use client'

import {
  Close as CloseIcon,
  Cookie as CookieIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material'
import {
  Box,
  Button,
  Collapse,
  Divider,
  FormControlLabel,
  FormGroup,
  IconButton,
  Link as MuiLink,
  Paper,
  Switch,
  Typography,
} from '@mui/material'
import Link from 'next/link'
import { type ChangeEvent, useCallback, useState } from 'react'

import { useCookieConsent } from '@/hooks/useCookieConsent'
import { type CookiePreferences } from '@/types/cookie.types'

export function CookieBanner(): JSX.Element | null {
  const [showDetails, setShowDetails] = useState(false)
  const { acceptAll, acceptSelected, decline, isBannerOpen, preferences: currentPreferences } = useCookieConsent()

  const [localPreferences, setLocalPreferences] = useState<CookiePreferences>(() => ({
    necessary: true,
    analytics: currentPreferences.analytics,
    marketing: currentPreferences.marketing,
    functional: currentPreferences.functional,
  }))

  const handleAcceptAll = useCallback(() => {
    acceptAll().catch(() => {})
  }, [acceptAll])

  const handleAcceptSelected = useCallback(() => {
    acceptSelected({
      analytics: localPreferences.analytics,
      marketing: localPreferences.marketing,
      functional: localPreferences.functional,
    }).catch(() => {})
  }, [acceptSelected, localPreferences])

  const handleDecline = useCallback(() => {
    decline().catch(() => {})
  }, [decline])

  const handlePreferenceChange = useCallback(
    (category: keyof CookiePreferences): ((event: ChangeEvent<HTMLInputElement>) => void) =>
      (event: ChangeEvent<HTMLInputElement>) => {
        if (category === 'necessary') return
        setLocalPreferences((prev) => ({
          ...prev,
          [category]: event.target.checked,
        }))
      },
    []
  )

  if (!isBannerOpen) {
    return null
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        p: 2,
        background: 'var(--gradient-overlay-subtle)',
      }}>
      <Paper
        elevation={8}
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
        }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
          <CookieIcon color="primary" sx={{ mt: 0.5 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Cookie Preferences
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
              By clicking &quot;Accept All&quot;, you consent to our use of cookies.
            </Typography>
          </Box>
          <IconButton size="small" onClick={handleDecline} aria-label="Close cookie banner">
            <CloseIcon />
          </IconButton>
        </Box>

        <Collapse in={showDetails}>
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" gutterBottom>
              Cookie Categories
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={<Switch checked={localPreferences.necessary} disabled />}
                label={
                  <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                      Necessary Cookies
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Essential for the website to function properly. Cannot be disabled.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Switch checked={localPreferences.analytics} onChange={handlePreferenceChange('analytics')} />}
                label={
                  <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                      Analytics Cookies
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Help us understand how visitors interact with our website.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={<Switch checked={localPreferences.marketing} onChange={handlePreferenceChange('marketing')} />}
                label={
                  <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                      Marketing Cookies
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Used to deliver relevant advertisements and track ad performance.
                    </Typography>
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Switch checked={localPreferences.functional} onChange={handlePreferenceChange('functional')} />
                }
                label={
                  <Box>
                    <Typography variant="body2" component="span" sx={{ fontWeight: 500 }}>
                      Functional Cookies
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      Enable enhanced functionality and personalization.
                    </Typography>
                  </Box>
                }
              />
            </FormGroup>
          </Box>
        </Collapse>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button variant="contained" onClick={handleAcceptAll} size="small">
            Accept All
          </Button>
          <Button variant="outlined" onClick={handleAcceptSelected} size="small">
            Accept Selected
          </Button>
          <Button variant="text" onClick={handleDecline} size="small">
            Decline All
          </Button>
          <Button
            variant="text"
            startIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowDetails(!showDetails)}
            size="small">
            {showDetails ? 'Less' : 'More'} Options
          </Button>
        </Box>

        <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
          Learn more in our{' '}
          <MuiLink component={Link} href="/privacy" underline="hover">
            Privacy Policy
          </MuiLink>{' '}
          and{' '}
          <MuiLink component={Link} href="/terms" underline="hover">
            Terms of Service
          </MuiLink>
          .
        </Typography>
      </Paper>
    </Box>
  )
}
