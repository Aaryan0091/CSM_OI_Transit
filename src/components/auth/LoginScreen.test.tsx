import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { LoginScreen } from './LoginScreen'

const baseProps: Parameters<typeof LoginScreen>[0] = {
  externalMessage: null,
  onLogin: vi.fn(async () => null),
  onPasswordReset: vi.fn(async () => null),
  onRefreshVerification: vi.fn(async () => null),
  onResendVerification: vi.fn(async () => null),
  onSignOut: vi.fn(async () => {}),
  onSignup: vi.fn(async () => null),
  pendingVerificationEmail: null,
  isRefreshingVerification: false,
  isSendingVerification: false,
  themeMode: 'light',
  onToggleTheme: vi.fn(),
  externalError: null,
}

describe('LoginScreen auth flow', () => {
  it('validates email before sending a password reset', async () => {
    render(<LoginScreen {...baseProps} />)

    fireEvent.click(screen.getByText('Forgot password?'))

    expect(await screen.findByText('Please enter your work email.')).not.toBeNull()
    expect(baseProps.onPasswordReset).not.toHaveBeenCalled()
  })

  it('shows the verification waiting state and wires actions', () => {
    const props = {
      ...baseProps,
      onRefreshVerification: vi.fn(async () => null),
      onResendVerification: vi.fn(async () => null),
      onSignOut: vi.fn(async () => {}),
      pendingVerificationEmail: 'person@company.com',
    }

    render(<LoginScreen {...props} />)

    expect(screen.getByText('Waiting for email verification')).not.toBeNull()
    expect(screen.getAllByText('Sign In')).toHaveLength(2)
    expect(screen.getByText('Resend Verification Email')).not.toBeNull()

    fireEvent.click(screen.getAllByText('Sign In')[1])
    fireEvent.click(screen.getByText('Resend Verification Email'))
    fireEvent.click(screen.getByText('Cancel and sign out'))

    expect(props.onRefreshVerification).toHaveBeenCalledTimes(1)
    expect(props.onResendVerification).toHaveBeenCalledTimes(1)
    expect(props.onSignOut).toHaveBeenCalledTimes(1)
  })
})
