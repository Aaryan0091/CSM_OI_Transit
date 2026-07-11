import { EyeClosedIcon, EyeIcon } from '../common/Icons'
import type { Theme, ThemeMode, User } from '../../types'

export function AppHeader({
  currentUser,
  theme,
  themeMode,
  onToggleTheme,
  onOpenNewOrder,
  onSignOut,
}: {
  currentUser: User
  theme: Theme
  themeMode: ThemeMode
  onToggleTheme: () => void
  onOpenNewOrder: () => void
  onSignOut: () => void
}) {
  return (
    <div
      style={{
        background: theme.headerBg,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
        <div
          style={{
            width: 28,
            height: 28,
            background: '#a8f5e9',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#1E3A5F', fontWeight: 900, fontSize: 13 }}>C</span>
        </div>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>CSM Engineers</span>
        <span style={{ color: theme.textSoft, fontWeight: 400, fontSize: 13, marginLeft: 4 }}>
          Order Tracker
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', padding: '12px 0' }}>
        <button
          onClick={onToggleTheme}
          style={{
            background: theme.surfaceAlt,
            color: theme.textMuted,
            border: `1px solid ${theme.headerBorder}`,
            borderRadius: '50%',
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {themeMode === 'dark' ? <EyeClosedIcon size={14} /> : <EyeIcon size={14} />}
        </button>
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>{currentUser.name}</div>
          <div style={{ color: theme.textSoft, fontSize: 10 }}>{currentUser.dept}</div>
        </div>
        {currentUser.dept === 'Admin' && (
          <button
            onClick={onOpenNewOrder}
            style={{
              background: '#a8f5e9',
              color: '#123850',
              border: 'none',
              borderRadius: 8,
              padding: '7px 16px',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            + New Order
          </button>
        )}
        <button
          onClick={onSignOut}
          style={{
            background: 'transparent',
            color: theme.textSoft,
            border: `1px solid ${theme.headerBorder}`,
            borderRadius: 8,
            padding: '7px 12px',
            fontWeight: 600,
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
