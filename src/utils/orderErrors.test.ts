import { describe, expect, it } from 'vitest'
import {
  getOrderCreationErrorDetails,
  getOrderCreationErrorMessage,
  OrderCreationError,
} from './orderErrors'

describe('order creation errors', () => {
  it('preserves exact local validation messages', () => {
    expect(
      getOrderCreationErrorMessage(
        new OrderCreationError('validation', 'The description is too long.'),
      ),
    ).toBe('The description is too long.')
  })

  it('reports a post-account-check rules denial without asking for another sign-in', () => {
    const details = getOrderCreationErrorDetails({ code: 'firestore/permission-denied' })

    expect(details.supportCode).toBe('ORDER-CREATE-RULES')
    expect(details.message).toContain('after your account check')
    expect(details.message).toContain('latest Firestore rules')
    expect(details.message).not.toContain('sign out and back in')
    expect(details.retryable).toBe(false)
  })

  it('reports connection failures accurately', () => {
    const details = getOrderCreationErrorDetails({ code: 'firestore/unavailable' })

    expect(details.message).toContain('internet connection')
    expect(details.supportCode).toBe('ORDER-CREATE-NETWORK')
    expect(details.retryable).toBe(true)
  })

  it.each([
    ['firestore/already-exists', 'ORDER-CREATE-DUPLICATE'],
    ['firestore/invalid-argument', 'ORDER-CREATE-DATA'],
    ['firestore/failed-precondition', 'ORDER-CREATE-DATA'],
    ['firestore/aborted', 'ORDER-CREATE-CONCURRENT'],
    ['firestore/resource-exhausted', 'ORDER-CREATE-CAPACITY'],
  ])('maps %s to the stable support code %s', (firebaseCode, supportCode) => {
    expect(getOrderCreationErrorDetails({ code: firebaseCode }).supportCode).toBe(supportCode)
  })

  it('gives unexpected failures a reference code', () => {
    const details = getOrderCreationErrorDetails(new Error('unexpected'))

    expect(details.message).toContain('ORDER-CREATE-UNKNOWN')
    expect(details.supportCode).toBe('ORDER-CREATE-UNKNOWN')
  })
})
