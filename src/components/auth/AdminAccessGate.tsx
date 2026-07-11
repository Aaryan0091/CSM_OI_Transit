import { useState, type FormEvent } from 'react'
import { THEMES, themedInputStyle } from '../../data/constants'
import { EyeClosedIcon, EyeIcon } from '../common/Icons'
import { Field } from '../common/Field'
import type { ThemeMode } from '../../types'

export function AdminAccessGate({
  onUnlock,
  onSignOut,
  themeMode,
  onToggleTheme,
  externalError,
}: {
  onUnlock: (code: string) => string | null
  onSignOut: () => Promise<void>
  themeMode: ThemeMode
  onToggleTheme: () => void
  externalError: string | null
}) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const theme = THEMES[themeMode]

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSubmitting(true)

    const nextError = onUnlock(code.trim())
    setIsSubmitting(false)

    if (!nextError) {
      setError('')
      setCode('')
      return
    }

    setError(nextError)
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)

    try {
      await onSignOut()
    } finally {
      setIsSigningOut(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background:
          themeMode === 'dark'
            ? 'radial-gradient(circle at top, #12324B 0%, #07111F 48%, #020617 100%)'
            : '#1E3A5F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', -apple-system, sans-serif",
        padding: 16,
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: theme.surface,
          borderRadius: 16,
          padding: '36px 32px',
          width: '100%',
          maxWidth: 360,
          boxShadow: theme.shadow,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                background: '#a8f5e9',
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#1E3A5F', fontWeight: 900, fontSize: 16 }}>C</span>
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>Admin Access</div>
              <div style={{ fontSize: 12, color: theme.textSoft }}>Enter the admin code to continue</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onToggleTheme}
            style={{
              border: `1px solid ${theme.border}`,
              background: theme.surfaceAlt,
              color: theme.textMuted,
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
        </div>

        <Field label="Admin Code" theme={theme}>
          <input
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoFocus
            placeholder="Enter access code"
            autoComplete="one-time-code"
            style={themedInputStyle(theme)}
          />
        </Field>

        {(error || externalError) && (
          <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 12 }}>
            {error || externalError}
          </div>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: 20,
            padding: '11px',
            borderRadius: 8,
            border: 'none',
            background: theme.primary,
            color: theme.primaryText,
            fontWeight: 700,
            fontSize: 14,
            cursor: isSubmitting ? 'wait' : 'pointer',
            opacity: isSubmitting ? 0.8 : 1,
          }}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Verifying...' : 'Continue as Admin'}
        </button>

        <button
          type="button"
          onClick={handleSignOut}
          style={{
            width: '100%',
            marginTop: 10,
            padding: '11px',
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: theme.surface,
            color: theme.textMuted,
            fontWeight: 700,
            fontSize: 14,
            cursor: isSigningOut ? 'wait' : 'pointer',
            opacity: isSigningOut ? 0.8 : 1,
          }}
          disabled={isSigningOut}
        >
          {isSigningOut ? 'Signing out...' : 'Back to Sign In'}
        </button>

        <div style={{ marginTop: 18, fontSize: 11, color: theme.textSoft, lineHeight: 1.6 }}>
          Admin accounts require a second access code before opening the dashboard.
        </div>
      </form>
    </div>
  )
}
