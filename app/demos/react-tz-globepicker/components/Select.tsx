import React, { useId } from 'react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
}

export function Select({ label, value, options, onChange }: SelectProps): React.ReactElement {
  const selectId = useId()
  return (
    <div>
      <label htmlFor={selectId} style={{ display: 'block', marginBottom: 6, fontWeight: 500 }}>
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          borderRadius: 6,
          border: '1px solid rgba(255, 255, 255, 0.2)',
          backgroundColor: '#1e1e2e',
          color: '#e0e0e0',
          fontSize: '0.8rem',
          cursor: 'pointer',
        }}>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ backgroundColor: '#1e1e2e', color: '#e0e0e0' }}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

export default Select
