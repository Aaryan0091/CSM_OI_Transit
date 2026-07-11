import type { Theme } from '../../types'

export function StatusBanner({
  message,
  tone,
  theme,
}: {
  message: string
  tone: 'info' | 'warning' | 'error'
  theme: Theme
}) {
  const palette =
    tone === 'info'
      ? { background: '#DBEAFE', color: '#1D4ED8' }
      : tone === 'warning'
        ? { background: '#FEF3C7', color: '#92400E' }
        : { background: '#FEE2E2', color: '#B91C1C' }

  return (
    <div
      style={{
        background: palette.background,
        color: palette.color,
        padding: '10px 20px',
        fontSize: 13,
        fontWeight: 600,
        borderBottom: `1px solid ${theme.border}`,
      }}
    >
      {message}
    </div>
  )
}
