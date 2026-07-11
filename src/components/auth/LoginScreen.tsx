import { useState, type FormEvent } from 'react'
import { AUTH_COPY } from '../../data/authCopy'
import { DEPARTMENTS, THEMES, themedInputStyle } from '../../data/constants'
import { EyeClosedIcon, EyeIcon } from '../common/Icons'
import { Field } from '../common/Field'
import type { Department, ThemeMode } from '../../types'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginScreen({
  onLogin,
  onSignup,
  themeMode,
  onToggleTheme,
  externalError,
}: {
  onLogin: (email: string, password: string) => Promise<string | null>
  onSignup: (payload: {
    name: string
    dept: Department
    email: string
    password: string
  }) => Promise<string | null>
  themeMode: ThemeMode
  onToggleTheme: () => void
  externalError: string | null
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left')
  const [name, setName] = useState('')
  const [dept, setDept] = useState<Department>('Sales')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const theme = THEMES[themeMode]
  const nameFieldId = 'signup-name'
  const roleFieldId = 'signup-role'
  const emailFieldId = `${mode}-email`
  const passwordFieldId = `${mode}-password`
  const confirmPasswordFieldId = 'signup-confirm-password'
  const errorMessageId = `${mode}-auth-error`

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setIsSubmitting(true)
    let nextError: string | null
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      nextError = AUTH_COPY.workEmailMissing
    } else if (!EMAIL_PATTERN.test(normalizedEmail)) {
      nextError = 'Please enter a valid email address.'
    } else if (!password) {
      nextError = 'Please enter your password.'
    } else if (mode === 'signup') {
      if (name.trim().length < 2) {
        nextError = 'Please enter your name.'
      } else if (password.length < 8) {
        nextError = AUTH_COPY.passwordMinLength
      } else if (password !== confirmPassword) {
        nextError = 'Passwords do not match.'
      } else {
        nextError = await onSignup({
          name: name.trim(),
          dept,
          email: normalizedEmail,
          password,
        })
      }
    } else {
      nextError = await onLogin(normalizedEmail, password)
    }

    setIsSubmitting(false)

    if (!nextError) {
      setError('')
      return
    }

    setError(nextError)
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
        <style>{`
          @keyframes auth-slide-left {
            0% { opacity: 0; transform: translateX(30px) scale(0.985); }
            100% { opacity: 1; transform: translateX(0) scale(1); }
          }
          @keyframes auth-slide-right {
            0% { opacity: 0; transform: translateX(-30px) scale(0.985); }
            100% { opacity: 1; transform: translateX(0) scale(1); }
          }
        `}</style>
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
              <div style={{ fontWeight: 800, fontSize: 16, color: theme.text }}>CSM Engineers</div>
              <div style={{ fontSize: 12, color: theme.textSoft }}>Order Tracker</div>
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

        <div
          style={{
            position: 'relative',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            marginBottom: 16,
            padding: 4,
            borderRadius: 14,
            background: theme.surfaceAlt,
            border: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 4,
              bottom: 4,
              left: mode === 'signin' ? 4 : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              borderRadius: 10,
              background: theme.primary,
              transition: 'left 340ms cubic-bezier(0.22, 1, 0.36, 1) 35ms',
              boxShadow: '0 8px 18px rgba(15, 23, 42, 0.16)',
            }}
          />
          {([
            { key: 'signin', label: 'Sign In' },
            { key: 'signup', label: 'Sign Up' },
          ] as const).map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => {
                if (option.key === mode) {
                  return
                }
                setSlideDirection(option.key === 'signup' ? 'left' : 'right')
                setMode(option.key)
                setError('')
              }}
              style={{
                position: 'relative',
                zIndex: 1,
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                background: 'transparent',
                color: mode === option.key ? theme.primaryText : theme.textMuted,
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          key={mode}
          style={{
            animation: `${slideDirection === 'left' ? 'auth-slide-left' : 'auth-slide-right'} 360ms cubic-bezier(0.22, 1, 0.36, 1) 45ms both`,
            transformOrigin: 'center center',
            willChange: 'transform, opacity',
          }}
        >
          {mode === 'signup' && (
            <>
              <Field label="Name" htmlFor={nameFieldId} theme={theme}>
                <input
                  id={nameFieldId}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  autoFocus
                  autoComplete="name"
                  placeholder="Your full name"
                  style={themedInputStyle(theme)}
                />
              </Field>
              <div style={{ height: 14 }} />
              <Field label="Role" htmlFor={roleFieldId} theme={theme}>
                <select
                  id={roleFieldId}
                  value={dept}
                  onChange={(event) => setDept(event.target.value as Department)}
                  style={themedInputStyle(theme)}
                >
                  {DEPARTMENTS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </Field>
              <div style={{ height: 14 }} />
            </>
          )}

          <Field label="Email" htmlFor={emailFieldId} theme={theme}>
            <input
              id={emailFieldId}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoFocus={mode === 'signin'}
              placeholder="name@company.com"
              type="email"
              autoComplete="email"
              aria-invalid={Boolean(error || externalError)}
              aria-describedby={error || externalError ? errorMessageId : undefined}
              style={themedInputStyle(theme)}
            />
          </Field>
          <div style={{ height: 14 }} />
          <Field label="Password" htmlFor={passwordFieldId} theme={theme}>
            <div style={{ position: 'relative' }}>
              <input
                id={passwordFieldId}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="........"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                aria-invalid={Boolean(error || externalError)}
                aria-describedby={error || externalError ? errorMessageId : undefined}
                style={{ ...themedInputStyle(theme), paddingRight: 64 }}
              />
              <button
                type="button"
                onClick={() => setShowPassword((previous) => !previous)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  border: 'none',
                  background: 'transparent',
                  color: theme.primary,
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && (
                    <path d="M4 20 20 4" />
                  )}
                </svg>
              </button>
            </div>
          </Field>

          {mode === 'signup' && (
            <>
              <div style={{ height: 14 }} />
              <Field label="Confirm Password" htmlFor={confirmPasswordFieldId} theme={theme}>
                <input
                  id={confirmPasswordFieldId}
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="Repeat password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(error || externalError)}
                  aria-describedby={error || externalError ? errorMessageId : undefined}
                  style={themedInputStyle(theme)}
                />
              </Field>
              <div style={{ marginTop: 8, fontSize: 11, color: theme.textSoft }}>
                {AUTH_COPY.manualAdminHelp}
              </div>
            </>
          )}

          {(error || externalError) && (
            <div
              id={errorMessageId}
              role="alert"
              aria-live="polite"
              style={{ color: '#DC2626', fontSize: 12, fontWeight: 600, marginTop: 12 }}
            >
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
            {isSubmitting
              ? mode === 'signup'
                ? 'Creating account...'
                : 'Signing in...'
              : mode === 'signup'
                ? 'Create Account'
                : 'Sign in'}
          </button>

          <div style={{ marginTop: 18, fontSize: 11, color: theme.textSoft, lineHeight: 1.6 }}>
            {mode === 'signup'
              ? AUTH_COPY.departmentSignupHelp
              : AUTH_COPY.profileHelp}
          </div>
        </div>
      </form>
    </div>
  )
}
