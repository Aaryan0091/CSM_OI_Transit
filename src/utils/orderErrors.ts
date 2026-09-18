export class OrderCreationError extends Error {
  readonly kind: 'validation' | 'authorization' | 'duplicate'

  constructor(
    kind: 'validation' | 'authorization' | 'duplicate',
    message: string,
  ) {
    super(message)
    this.name = 'OrderCreationError'
    this.kind = kind
  }
}

export type OrderCreationErrorDetails = {
  message: string
  supportCode: string | null
  retryable: boolean
}

export function getFirebaseErrorCode(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : ''
}

function withReference(message: string, supportCode: string) {
  return `${message} Reference: ${supportCode}.`
}

export function getOrderCreationErrorDetails(error: unknown): OrderCreationErrorDetails {
  if (error instanceof OrderCreationError) {
    return {
      message: error.message,
      supportCode: null,
      retryable: error.kind !== 'authorization',
    }
  }

  const code = getFirebaseErrorCode(error)

  if (code.includes('appCheck/') || code.includes('app-check/')) {
    const supportCode = 'ORDER-CREATE-APP-CHECK'
    return {
      message: withReference(
        'App Check could not verify this browser. Reload the page. On localhost, register this browser’s private debug token.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  if (code.includes('unauthenticated')) {
    const supportCode = 'ORDER-CREATE-SIGN-IN'
    return {
      message: withReference(
        'Your sign-in session has expired. Sign out, sign back in, and try again.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  if (code.includes('permission-denied')) {
    const supportCode = 'ORDER-CREATE-PERMISSION'
    return {
      message: withReference(
        'Your account is not currently authorized to create this order. Confirm that your email is verified and your profile is Admin or Sales, then sign out and back in.',
        supportCode,
      ),
      supportCode,
      retryable: false,
    }
  }

  if (code.includes('already-exists')) {
    const supportCode = 'ORDER-CREATE-DUPLICATE'
    return {
      message: withReference(
        'That order number or generated system ID is already in use. Refresh the order list and use a different order number.',
        supportCode,
      ),
      supportCode,
      retryable: false,
    }
  }

  if (code.includes('invalid-argument') || code.includes('failed-precondition')) {
    const supportCode = 'ORDER-CREATE-DATA'
    return {
      message: withReference(
        'Firestore rejected part of the order data after local validation. Refresh the application and enter the order again.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  if (code.includes('aborted')) {
    const supportCode = 'ORDER-CREATE-CONCURRENT'
    return {
      message: withReference(
        'Another order was allocated at the same time. Please submit this order again.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  if (code.includes('resource-exhausted')) {
    const supportCode = 'ORDER-CREATE-CAPACITY'
    return {
      message: withReference(
        'Firestore is temporarily at capacity. Wait a moment and try again.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  if (
    code.includes('unavailable') ||
    code.includes('deadline-exceeded') ||
    code.includes('network-request-failed')
  ) {
    const supportCode = 'ORDER-CREATE-NETWORK'
    return {
      message: withReference(
        'The order could not reach Firestore. Check your internet connection and try again.',
        supportCode,
      ),
      supportCode,
      retryable: true,
    }
  }

  const supportCode = 'ORDER-CREATE-UNKNOWN'
  return {
    message: withReference(
      'The new order could not be created. Retry once; if it fails again, send this reference code to an administrator.',
      supportCode,
    ),
    supportCode,
    retryable: true,
  }
}

export function getOrderCreationErrorMessage(error: unknown) {
  return getOrderCreationErrorDetails(error).message
}
