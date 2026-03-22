import React, { useId } from 'react'
import { format, parseISO } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import {
  SpaceBackground,
  TZ_BOUNDARY_MODES,
  type TzBoundaryMode,
  type GlobePalette,
} from '@mmerlone/react-tz-globepicker'

import CustomBackground from './CustomBackground'
import { Select } from './Select'
import { NumberInput } from './NumberInput'
import { ColorInput } from './ColorInput'
import { Toggle } from './Toggle'
import { Box } from '@mui/material'

type BackgroundType = 'transparent' | 'color' | 'space' | 'space-image' | 'custom'

type ControlPanelProps = {
  timezone: string | null
  onTimezoneChange: (tz: string | null) => void
  size: number
  onSizeChange: (n: number) => void
  showMarkers: boolean
  onShowMarkersChange: (v: boolean) => void
  showTooltips: boolean
  onShowTooltipsChange: (v: boolean) => void
  zoomMarkers: boolean
  onZoomMarkersChange: (v: boolean) => void
  minZoom: number
  onMinZoomChange: (v: number) => void
  maxZoom: number
  onMaxZoomChange: (v: number) => void
  currentZoom: number
  onCurrentZoomChange: (v: number) => void
  showTZBoundaries: TzBoundaryMode
  onShowTZBoundariesChange: (m: TzBoundaryMode) => void
  showCountryBorders: boolean
  onShowCountryBordersChange: (v: boolean) => void
  showGeographic: boolean
  onShowGeographicChange: (v: boolean) => void
  backgroundType: BackgroundType
  backgroundValue: string | null
  onBackgroundTypeChange: (t: BackgroundType) => void
  onBackgroundValueChange: (v: string | null) => void
  colors: GlobePalette
  onColorsChange: (c: GlobePalette) => void
  onReset: () => void
  timezoneOptions: readonly string[]
  simulatedDate?: Date
  onSimulatedDateChange: (d: Date | undefined) => void
}

export function ControlPanel({
  timezone,
  onTimezoneChange,
  size,
  onSizeChange,
  showMarkers,
  onShowMarkersChange,
  showTooltips,
  onShowTooltipsChange,
  zoomMarkers,
  onZoomMarkersChange,
  minZoom,
  onMinZoomChange,
  maxZoom,
  onMaxZoomChange,
  currentZoom,
  onCurrentZoomChange,
  showTZBoundaries,
  onShowTZBoundariesChange,
  showCountryBorders,
  onShowCountryBordersChange,
  showGeographic,
  onShowGeographicChange,
  backgroundType,
  backgroundValue,
  onBackgroundTypeChange,
  onBackgroundValueChange,
  colors,
  onColorsChange,
  onReset,
  timezoneOptions,
  simulatedDate,
  onSimulatedDateChange,
}: ControlPanelProps): React.ReactElement {
  const [copyLabel, setCopyLabel] = React.useState<string>('Copy JSON')
  const controlPanelId = useId()

  const handleColorChange = (key: keyof GlobePalette, value: string): void => {
    onColorsChange({ ...colors, [key]: value })
  }

  const handleBackgroundTypeSelect = (t: BackgroundType): void => {
    onBackgroundTypeChange(t)
    if (t === 'color') {
      if (!backgroundValue) onBackgroundValueChange('#000000')
    }
    if (t === 'transparent') {
      if (backgroundValue) onBackgroundValueChange(null)
    }
  }

  const timezoneSelectOptions: Array<{ value: string; label: string }> = [
    { value: '', label: 'None' },
    ...timezoneOptions.map((tz) => ({ value: tz, label: tz })),
  ]

  return (
    <Box id={controlPanelId} aria-label="Control Panel" style={{ height: '100%' }}>
      <aside
        style={{
          width: '100%',
          height: '100%',
          maxWidth: 'calc(100vw - 12px)',
          overflowY: 'scroll',
          backgroundColor: 'rgba(30, 30, 46, 0.95)',
          padding: 12,
          color: '#e0e0e0',
          fontSize: '0.8rem',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
          borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
          zIndex: 1000,
          display: 'block',
        }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
            paddingBottom: 8,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Controls</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Basic */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <div style={{ fontWeight: 600 }}>Basic</div>
              <button
                onClick={onReset}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e0e0e0',
                  padding: '4px 8px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                }}>
                Reset Demo
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: '1fr 1fr',
              }}>
              <div>
                <Select
                  label="Timezone"
                  value={timezone ?? ''}
                  options={timezoneSelectOptions}
                  onChange={(v) => onTimezoneChange(v ?? null)}
                />
              </div>
              <div>
                <NumberInput label="Size (px)" value={size} onChange={onSizeChange} min={100} max={1200} step={50} />
              </div>

              <div style={{ gridColumn: '1 / span 2' }}>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'center',
                    flexWrap: 'wrap',
                  }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="bgType"
                      checked={backgroundType === 'transparent'}
                      onChange={() => handleBackgroundTypeSelect('transparent')}
                    />
                    Transparent
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="bgType"
                      checked={backgroundType === 'color'}
                      onChange={() => handleBackgroundTypeSelect('color')}
                    />
                    Solid Color
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="bgType"
                      checked={backgroundType === 'space'}
                      onChange={() => handleBackgroundTypeSelect('space')}
                    />
                    Space
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="bgType"
                      checked={backgroundType === 'space-image'}
                      onChange={() => handleBackgroundTypeSelect('space-image')}
                    />
                    Space Image
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="radio"
                      name="bgType"
                      checked={backgroundType === 'custom'}
                      onChange={() => handleBackgroundTypeSelect('custom')}
                    />
                    Custom
                  </label>

                  <div
                    style={{
                      marginLeft: 'auto',
                      width: '100%',
                      height: 60,
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: 4,
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                    aria-hidden>
                    {backgroundType === 'transparent' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundImage:
                            'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                          backgroundSize: '8px 8px',
                          backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
                        }}
                      />
                    )}
                    {backgroundType === 'color' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          background: backgroundValue ?? '#000000',
                        }}
                      />
                    )}
                    {backgroundType === 'space' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                        }}>
                        <SpaceBackground />
                      </div>
                    )}
                    {backgroundType === 'space-image' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          backgroundImage: 'url(/space.jpg)',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                        }}
                      />
                    )}
                    {backgroundType === 'custom' && (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          overflow: 'hidden',
                        }}>
                        <CustomBackground />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 8 }}>
                  {backgroundType === 'color' && (
                    <input
                      type="color"
                      value={backgroundValue ?? '#000000'}
                      onChange={(e) => onBackgroundValueChange(e.target.value)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Markers */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <div style={{ fontWeight: 600 }}>Markers</div>
            </div>

            <div style={{ display: 'grid', gap: 6 }}>
              <Toggle label="Show markers" checked={showMarkers} onChange={onShowMarkersChange} />

              <Toggle
                label="Show tooltips"
                checked={showTooltips}
                onChange={onShowTooltipsChange}
                disabled={!showMarkers}
              />

              <Toggle label="Zoom markers" checked={zoomMarkers} onChange={onZoomMarkersChange} />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: 8,
                }}>
                <NumberInput
                  label="Min zoom"
                  value={minZoom}
                  onChange={onMinZoomChange}
                  min={0.01}
                  max={1}
                  step={0.01}
                  precision={2}
                />
                <NumberInput label="Max zoom" value={maxZoom} onChange={onMaxZoomChange} min={1} max={20} step={0.5} />
                <NumberInput
                  label="Zoom"
                  value={currentZoom}
                  onChange={onCurrentZoomChange}
                  min={0.1}
                  max={10}
                  step={0.1}
                  precision={2}
                />
              </div>
            </div>
          </div>

          {/* Boundaries */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <div style={{ fontWeight: 600 }}>Boundaries</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="tzBoundaries"
                    checked={showTZBoundaries === TZ_BOUNDARY_MODES.NONE}
                    onChange={() => onShowTZBoundariesChange(TZ_BOUNDARY_MODES.NONE)}
                  />
                  None
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="tzBoundaries"
                    checked={showTZBoundaries === TZ_BOUNDARY_MODES.NAUTIC}
                    onChange={() => onShowTZBoundariesChange(TZ_BOUNDARY_MODES.NAUTIC)}
                  />
                  Nautic
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="tzBoundaries"
                    checked={showTZBoundaries === TZ_BOUNDARY_MODES.ETCGMT}
                    onChange={() => onShowTZBoundariesChange(TZ_BOUNDARY_MODES.ETCGMT)}
                  />
                  ETC/GMT
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <input
                    type="radio"
                    name="tzBoundaries"
                    checked={showTZBoundaries === TZ_BOUNDARY_MODES.IANA}
                    onChange={() => onShowTZBoundariesChange(TZ_BOUNDARY_MODES.IANA)}
                  />
                  IANA
                </label>
              </div>

              <Toggle label="Show country borders" checked={showCountryBorders} onChange={onShowCountryBordersChange} />
              <Toggle label="Show geographic lines" checked={showGeographic} onChange={onShowGeographicChange} />
            </div>
          </div>

          {/* Simulated Date/Time for Sun Position Testing */}
          <div>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Simulated Date/Time</div>
            <div style={{ display: 'grid', gap: 6 }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                  Set date/time to test sun position (e.g., solstices)
                </span>
                <input
                  type="datetime-local"
                  value={
                    simulatedDate
                      ? format(
                          toZonedTime(simulatedDate, Intl.DateTimeFormat().resolvedOptions().timeZone),
                          "yyyy-MM-dd'T'HH:mm"
                        )
                      : ''
                  }
                  onChange={(e) => {
                    if (e.target.value) {
                      const localDate = parseISO(e.target.value + ':00')
                      const utcDate = fromZonedTime(localDate, Intl.DateTimeFormat().resolvedOptions().timeZone)
                      onSimulatedDateChange(utcDate)
                    } else {
                      onSimulatedDateChange(undefined)
                    }
                  }}
                  style={{
                    padding: '8px',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.15)',
                    background: 'rgba(0,0,0,0.2)',
                    color: '#e0e0e0',
                    fontSize: '0.9rem',
                    colorScheme: 'dark',
                  }}
                />
              </label>
            </div>
            <button
              onClick={() => onSimulatedDateChange(undefined)}
              style={{
                marginTop: 8,
                background: 'none',
                border: '1px solid rgba(255,255,255,0.15)',
                color: '#e0e0e0',
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: '0.75rem',
              }}>
              Reset to Now
            </button>
            <div style={{ marginTop: 8, fontSize: '0.75rem', opacity: 0.6 }}>
              {simulatedDate
                ? `Simulating: ${simulatedDate.toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}`
                : 'Using current time'}
            </div>
          </div>

          {/* Colors */}
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}>
              <div style={{ fontWeight: 600 }}>Colors</div>
              <button
                onClick={() => onColorsChange({ ...colors })}
                style={{
                  background: 'none',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#e0e0e0',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}>
                Reset
              </button>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}>
              {(Object.keys(colors) as Array<keyof GlobePalette>).map((k) => (
                <ColorInput
                  key={String(k)}
                  label={String(k)}
                  value={colors[k]}
                  onChange={(v) => handleColorChange(k, v)}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={async (): Promise<void> => {
                const json = JSON.stringify(colors, null, 2)
                await navigator.clipboard.writeText(json)
                setCopyLabel('✓ Copied!')
                setTimeout(() => setCopyLabel('Copy JSON'), 2000)
              }}
              style={{
                marginTop: 8,
                padding: '4px 8px',
                fontSize: '0.75rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 4,
                color: '#e0e0e0',
                cursor: 'pointer',
              }}>
              {copyLabel}
            </button>
          </div>
        </div>
      </aside>
    </Box>
  )
}

export default ControlPanel
