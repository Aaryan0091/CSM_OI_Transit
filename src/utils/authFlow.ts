type AuthListenerUser = {
  email: string | null
  emailVerified: boolean
}

export type AuthGateState =
  | { status: 'signed_out' }
  | { email: string; status: 'pending_verification' }
  | { status: 'authenticated' }

export function resolveAuthGateState(user: AuthListenerUser | null): AuthGateState {
  if (!user) {
    return { status: 'signed_out' }
  }

  if (!user.emailVerified) {
    return {
      status: 'pending_verification',
      email: user.email ?? '',
    }
  }

  return { status: 'authenticated' }
}
