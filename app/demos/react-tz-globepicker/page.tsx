'use client'

import React, { useEffect, useMemo, useState, Suspense, useId } from 'react'
import {
  TzGlobePicker,
  IANA_TZ_DATA,
  SpaceBackground,
  TZ_BOUNDARY_MODES,
  type GlobePalette,
  type TzBoundaryMode,
} from '@mmerlone/react-tz-globepicker'

import { Box, Typography, Card, CardContent, Chip, Stack, Link as MuiLink, CircularProgress, Grid } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'

const CUSTOM_COLORS: GlobePalette = {
  ocean: '#94c8ff',
  land: '#21912a',
  border: '#4d8950ff',
  graticule: 'rgba(255,255,255,0.28)',
  geographic: 'rgba(245, 6, 6, 0.15)',
  rim: 'rgba(255,255,255,0.25)',
  defaultMarker: '#e0e1dd',
  defaultMarkerStroke: '#1b263b',
  selectedMarker: '#ffb300',
  selectedMarkerStroke: '#ffffff',
  hoveredMarker: '#ffca28',
  hoveredMarkerStroke: '#ffffff',
  highlightFill: 'rgba(255, 179, 0, 0.4)',
  highlightStroke: '#ff8f00',
  highlightCountryBorder: 'rgba(255,255,255,0.3)',
}

const DEFAULT_TIMEZONE = 'America/Sao_Paulo'
const DEFAULT_SIZE = 600
const DEFAULT_SHOW_MARKERS = true
const DEFAULT_SHOW_TOOLTIPS = true
const DEFAULT_ZOOM_MARKERS = true
const DEFAULT_MIN_ZOOM = 0.1
const DEFAULT_MAX_ZOOM = 10
const DEFAULT_INITIAL_ZOOM = 0.8
const DEFAULT_SHOW_TZ_BOUNDARIES = TZ_BOUNDARY_MODES.ETCGMT
const DEFAULT_SHOW_COUNTRY_BORDERS = true
const DEFAULT_SHOW_GEOGRAPHIC = true

const ControlPanel = React.lazy(async () => {
  const mod = await import('./components/ControlPanel')
  return { default: mod.ControlPanel }
})

function CustomBackground(): React.ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    />
  )
}

export default function ReactTzGlobePickerDemo(): React.ReactElement {
  const [shouldMountControlPanel, setShouldMountControlPanel] = useState(false)
  const demoId = useId()

  // Form state
  const [timezone, setTimezone] = useState<string | null>(DEFAULT_TIMEZONE)
  const [size, setSize] = useState<number>(DEFAULT_SIZE)
  const [showMarkers, setShowMarkers] = useState<boolean>(DEFAULT_SHOW_MARKERS)
  const [showTooltips, setShowTooltips] = useState<boolean>(DEFAULT_SHOW_TOOLTIPS)
  const [zoomMarkers, setZoomMarkers] = useState<boolean>(DEFAULT_ZOOM_MARKERS)
  const [minZoom, setMinZoom] = useState<number>(DEFAULT_MIN_ZOOM)
  const [maxZoom, setMaxZoom] = useState<number>(DEFAULT_MAX_ZOOM)
  const [initialZoom, setInitialZoom] = useState<number>(DEFAULT_INITIAL_ZOOM)
  const [currentZoom, setCurrentZoom] = useState<number>(DEFAULT_INITIAL_ZOOM)
  const [showTZBoundaries, setShowTZBoundaries] = useState<TzBoundaryMode>(DEFAULT_SHOW_TZ_BOUNDARIES)
  const [showCountryBorders, setShowCountryBorders] = useState<boolean>(DEFAULT_SHOW_COUNTRY_BORDERS)
  const [showGeographic, setShowGeographic] = useState<boolean>(DEFAULT_SHOW_GEOGRAPHIC)
  const [backgroundType, setBackgroundType] = useState<'transparent' | 'color' | 'space' | 'space-image' | 'custom'>(
    'transparent'
  )
  const [backgroundValue, setBackgroundValue] = useState<string | null>(null)
  const [colors, setColors] = useState<GlobePalette>(CUSTOM_COLORS)
  const [simulatedDate, setSimulatedDate] = useState<Date | undefined>(undefined)

  useEffect((): (() => void) => {
    const timer = setTimeout((): void => {
      setShouldMountControlPanel(true)
    }, 200)
    return (): void => {
      clearTimeout(timer)
    }
  }, [])

  // Compute background prop passed to TzGlobePicker
  const backgroundProp = useMemo((): React.ReactElement | string | null => {
    if (backgroundType === 'transparent') return null
    if (backgroundType === 'color') return backgroundValue
    if (backgroundType === 'space') return <SpaceBackground />
    if (backgroundType === 'space-image') {
      return (
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundImage: 'url(/space.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )
    }
    if (backgroundType === 'custom') return <CustomBackground />
    return null
  }, [backgroundType, backgroundValue])

  // Reset handler
  const handleReset = (): void => {
    setTimezone(DEFAULT_TIMEZONE)
    setSize(DEFAULT_SIZE)
    setShowMarkers(DEFAULT_SHOW_MARKERS)
    setShowTooltips(DEFAULT_SHOW_TOOLTIPS)
    setZoomMarkers(DEFAULT_ZOOM_MARKERS)
    setMinZoom(DEFAULT_MIN_ZOOM)
    setMaxZoom(DEFAULT_MAX_ZOOM)
    setInitialZoom(DEFAULT_INITIAL_ZOOM)
    setCurrentZoom(DEFAULT_INITIAL_ZOOM)
    setShowTZBoundaries(DEFAULT_SHOW_TZ_BOUNDARIES)
    setShowCountryBorders(DEFAULT_SHOW_COUNTRY_BORDERS)
    setBackgroundType('transparent')
    setBackgroundValue(null)
    setColors(CUSTOM_COLORS)
  }

  return (
    <Box id={`react-tz-globepicker-demo-${demoId}`}>
      {/* Globe Demo */}
      <Box
        sx={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'auto max-content' },
          // display: 'flex',
          // flexDirection: { xs: 'column', md: 'row' },
          boxSizing: 'border-box',
          gap: 2,
          p: 2,
        }}>
        {/* Marketing Header */}
        <Grid maxWidth="lg" sx={{ pt: 4, pb: 2 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" component="h1" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>
              react-tz-globepicker
            </Typography>
            <Typography variant="h6" sx={{ color: 'grey.400', mb: 3, maxWidth: 700, mx: 'auto' }}>
              An interactive 3D globe component for selecting timezones with beautiful visualizations, markers, and
              customizable styling.
            </Typography>
            <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap" gap={1}>
              <Chip
                icon={<GitHubIcon />}
                label="GitHub"
                component={MuiLink}
                href="https://github.com/mmerlone/react-tz-globepicker"
                target="_blank"
                rel="noreferrer"
                clickable
                sx={{ bgcolor: 'grey.800', color: '#fff', '&:hover': { bgcolor: 'grey.700' } }}
              />
              <Chip
                label="npm"
                component={MuiLink}
                href="https://www.npmjs.com/package/@mmerlone/react-tz-globepicker"
                target="_blank"
                rel="noreferrer"
                clickable
                sx={{ bgcolor: '#cb3837', color: '#fff', '&:hover': { bgcolor: '#d9443f' } }}
              />
            </Stack>
          </Box>

          {/* Features */}
          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ mb: 4, justifyContent: 'center' }}>
            <Card sx={{ maxWidth: 250, bgcolor: '#161b22', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#58a6ff' }}>
                  3D Globe
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Interactive WebGL-powered globe with smooth rotation and zoom
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ maxWidth: 250, bgcolor: '#161b22', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#58a6ff' }}>
                  Timezone Markers
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  400+ timezone markers with tooltips and customizable appearance
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ maxWidth: 250, bgcolor: '#161b22', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#58a6ff' }}>
                  Customizable
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  Full control over colors, borders, backgrounds, and visual elements
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ maxWidth: 250, bgcolor: '#161b22', color: '#fff' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: '#58a6ff' }}>
                  Accessible
                </Typography>
                <Typography variant="body2" sx={{ color: 'grey.400' }}>
                  ARIA labels, keyboard navigation, and screen reader support
                </Typography>
              </CardContent>
            </Card>
          </Stack>

          {/* Demo Section Title */}
          <Typography variant="h5" sx={{ color: '#fff', mb: 3, textAlign: 'center' }}>
            Interactive Demo
          </Typography>
          <Typography variant="body2" sx={{ color: 'grey.500', mb: 3, textAlign: 'center' }}>
            Use the control panel on the right to customize the globe appearance
          </Typography>
        </Grid>

        {/* Control Panel */}
        <Grid
          maxWidth="lg"
          sx={{
            flex: '0 0 380px',
            width: { xs: '100%', md: 380 },
            maxHeight: { xs: '50vh', md: 'none' },
            overflowY: { xs: 'auto', md: 'visible' },
            bgcolor: '#161b22',
            borderRadius: 1,
            gridRowStart: { xs: 2, md: 1 },
            gridRowEnd: { xs: 'span 2', md: '3' },
          }}>
          {shouldMountControlPanel ? (
            <Suspense fallback={<CircularProgress />}>
              <ControlPanel
                timezone={timezone}
                onTimezoneChange={setTimezone}
                size={size}
                onSizeChange={setSize}
                showMarkers={showMarkers}
                onShowMarkersChange={setShowMarkers}
                showTooltips={showTooltips}
                onShowTooltipsChange={setShowTooltips}
                zoomMarkers={zoomMarkers}
                onZoomMarkersChange={setZoomMarkers}
                minZoom={minZoom}
                onMinZoomChange={setMinZoom}
                maxZoom={maxZoom}
                onMaxZoomChange={setMaxZoom}
                currentZoom={currentZoom}
                onCurrentZoomChange={setCurrentZoom}
                showTZBoundaries={showTZBoundaries}
                onShowTZBoundariesChange={setShowTZBoundaries}
                showCountryBorders={showCountryBorders}
                onShowCountryBordersChange={setShowCountryBorders}
                showGeographic={showGeographic}
                onShowGeographicChange={setShowGeographic}
                backgroundType={backgroundType}
                backgroundValue={backgroundValue}
                onBackgroundTypeChange={setBackgroundType}
                onBackgroundValueChange={setBackgroundValue}
                colors={colors}
                onColorsChange={setColors}
                onReset={handleReset}
                timezoneOptions={IANA_TZ_DATA}
                simulatedDate={simulatedDate}
                onSimulatedDateChange={setSimulatedDate}
              />
            </Suspense>
          ) : null}
        </Grid>

        {/* Globe Area */}
        <Grid
          maxWidth="lg"
          sx={{
            flex: '1 1 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 400,
          }}>
          <TzGlobePicker
            timezone={timezone}
            size={size}
            onSelect={(tz: string | null): void => setTimezone(tz)}
            showMarkers={showMarkers}
            showTooltips={showTooltips}
            zoomMarkers={zoomMarkers}
            minZoom={minZoom}
            maxZoom={maxZoom}
            initialZoom={initialZoom}
            zoom={currentZoom}
            onZoomChange={setCurrentZoom}
            showTZBoundaries={showTZBoundaries}
            showCountryBorders={showCountryBorders}
            showGeographic={showGeographic}
            background={backgroundProp}
            colors={colors}
            simulatedDate={simulatedDate}
          />

          <Typography sx={{ mt: 2, color: '#fff', fontSize: '1rem', opacity: 0.8 }}>
            Selected: <strong style={{ color: '#64b5f6' }}>{timezone ?? 'none'}</strong>
          </Typography>
        </Grid>
      </Box>
    </Box>
  )
}
