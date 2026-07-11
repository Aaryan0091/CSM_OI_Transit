export function mapAuthError(error: unknown) {
  if (
    typeof error === 'object' &&
    error &&
    'code' in error &&
    typeof error.code === 'string'
  ) {
    switch (error.code) {
      case 'auth/configuration-not-found':
        return 'Firebase Auth is not fully configured. Enable Email/Password sign-in in Firebase Console and verify your auth settings.'
      case 'auth/operation-not-allowed':
        return 'Email/Password sign-in is currently disabled in Firebase Console.'
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Incorrect email or password.'
      case 'auth/invalid-email':
        return 'Please enter a valid email address.'
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.'
      case 'auth/email-already-in-use':
        return 'This email is already registered. Please sign in instead.'
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.'
      case 'auth/network-request-failed':
        return 'Network request failed. Check your internet connection and make sure no browser extension is blocking Firebase.'
      default:
        break
    }
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Unable to sign in right now.'
}
