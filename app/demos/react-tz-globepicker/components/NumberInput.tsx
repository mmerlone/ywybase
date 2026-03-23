import React, { useId } from 'react'

interface NumberInputProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  precision?: number
}

export function NumberInput({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  precision,
}: NumberInputProps): React.ReactElement {
  const id = useId()
  const displayValue = typeof precision === 'number' ? value.toFixed(precision) : String(value)
  return (
    <div style={{ minWidth: 0 }}>
      <label
        htmlFor={id}
        style={{
          display: 'block',
          marginBottom: 4,
          fontSize: '0.75rem',
          opacity: 0.7,
        }}>
        {label}
      </label>
      <input
        id={id}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          const parsed = parseFloat(e.target.value)
          if (!Number.isNaN(parsed)) {
            onChange(parsed)
          }
        }}
        type="number"
        value={displayValue}
        min={min}
        max={max}
        step={step}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: '6px 8px',
          borderRadius: 4,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          color: '#e0e0e0',
          fontSize: '0.8rem',
        }}
      />
    </div>
  )
}

export default NumberInput
