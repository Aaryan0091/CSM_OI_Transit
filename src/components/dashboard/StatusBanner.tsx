import type { Theme } from '../../types'

export function StatusBanner({
  actions,
  isActionBusy,
  message,
  onAction,
  tone,
  theme,
}: {
  actions?: Array<{
    disabled?: boolean
    label: string
    onClick: () => void
  }>
  isActionBusy?: boolean
  message: string
  onAction?: () => void
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <span>{message}</span>
      {actions && actions.length > 0 ? (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={action.onClick}
              disabled={action.disabled}
              style={{
                background: '#fff',
                color: palette.color,
                border: `1px solid ${theme.border}`,
                borderRadius: 999,
                padding: '6px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: action.disabled ? 'wait' : 'pointer',
                opacity: action.disabled ? 0.8 : 1,
              }}
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : onAction ? (
        <button
          type="button"
          onClick={onAction}
          disabled={isActionBusy}
          style={{
            background: '#fff',
            color: palette.color,
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            padding: '6px 12px',
            fontSize: 12,
            fontWeight: 700,
            cursor: isActionBusy ? 'wait' : 'pointer',
            opacity: isActionBusy ? 0.8 : 1,
          }}
        >
          Take action
        </button>
      ) : null}
    </div>
  )
}
