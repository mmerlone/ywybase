import React, { useMemo, useState } from 'react'
import { colord } from 'colord'

type ColorResult = {
  rgb: {
    r: number
    g: number
    b: number
    a?: number
  }
}

type ChromePickerComponent = React.ComponentType<{
  color: { r: number; g: number; b: number; a: number }
  disableAlpha?: boolean
  onChangeComplete: (color: ColorResult) => void
}>

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function parseColorToRgba(color: string): {
  r: number
  g: number
  b: number
  a: number
} {
  if (!color) return { r: 0, g: 0, b: 0, a: 1 }
  const c = colord(color)
  if (!c.isValid()) return { r: 0, g: 0, b: 0, a: 1 }
  const { r, g, b, a } = c.toRgb()
  return { r, g, b, a: a ?? 1 }
}

function rgbaToString({ r, g, b, a }: { r: number; g: number; b: number; a: number }): string {
  return `rgba(${r}, ${g}, ${b}, ${a})`
}

export function ColorInput({ label, value, onChange, disabled = false }: ColorInputProps): React.ReactElement {
  const [open, setOpen] = useState(false)
  const [ChromePicker, setChromePicker] = useState<ChromePickerComponent | null>(null)

  const rgba = useMemo(() => parseColorToRgba(value), [value])

  const handleToggle = async (): Promise<void> => {
    if (disabled) return

    if (!open && ChromePicker === null) {
      const mod = await import('react-color')
      const LoadedChromePicker = (props: React.ComponentProps<ChromePickerComponent>): React.ReactElement => (
        <mod.ChromePicker {...props} />
      )
      setChromePicker(() => LoadedChromePicker)
    }

    setOpen((v) => !v)
  }

  const swatchStyle: React.CSSProperties = {
    width: 28,
    height: 24,
    borderRadius: 4,
    border: '1px solid rgba(255, 255, 255, 0.2)',
    background: rgbaToString(rgba),
    cursor: disabled ? 'not-allowed' : 'pointer',
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={swatchStyle}
        onClick={() => {
          handleToggle().catch(() => {})
        }}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleToggle().catch(() => {})
          }
        }}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={`Select color for ${label}`}
        aria-disabled={disabled}
        title={label}
      />

      <span
        style={{
          fontSize: '0.7rem',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={label}>
        {label}
      </span>

      {open && ChromePicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999 }}>
          <div style={{ position: 'absolute', inset: 0 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', right: 12, top: 48 }}>
            <ChromePicker
              color={rgba}
              disableAlpha={false}
              onChangeComplete={(col: ColorResult) => {
                const { r, g, b, a } = col.rgb
                onChange(rgbaToString({ r, g, b, a: a ?? 1 }))
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorInput
