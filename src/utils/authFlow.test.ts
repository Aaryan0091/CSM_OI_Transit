import { describe, expect, it } from 'vitest'
import { resolveAuthGateState } from './authFlow'

describe('resolveAuthGateState', () => {
  it('returns signed_out when there is no firebase user', () => {
    expect(resolveAuthGateState(null)).toEqual({ status: 'signed_out' })
  })

  it('returns pending_verification for unverified users', () => {
    expect(
      resolveAuthGateState({
        email: 'person@company.com',
        emailVerified: false,
      }),
    ).toEqual({
      status: 'pending_verification',
      email: 'person@company.com',
    })
  })

  it('returns authenticated for verified users', () => {
    expect(
      resolveAuthGateState({
        email: 'person@company.com',
        emailVerified: true,
      }),
    ).toEqual({ status: 'authenticated' })
  })
})
