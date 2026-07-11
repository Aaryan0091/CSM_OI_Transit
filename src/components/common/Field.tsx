import type { ReactNode } from 'react'
import type { Theme } from '../../types'

export function Field({
  label,
  children,
  accent = false,
  theme,
}: {
  label: string
  children: ReactNode
  accent?: boolean
  theme: Theme
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 11,
          fontWeight: 700,
          color: accent ? '#DC2626' : theme.textMuted,
          letterSpacing: '0.06em',
          marginBottom: 6,
        }}
      >
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  )
}
