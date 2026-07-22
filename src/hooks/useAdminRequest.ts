import { useState } from 'react'
import { createAdminRequest } from '../services/adminRequests'
import type { User } from '../types'

export function useAdminRequest(currentUser: User | null) {
  const [requestError, setRequestError] = useState<string | null>(null)
  const [requestMessage, setRequestMessage] = useState<string | null>(null)
  const [isRequestingAdmin, setIsRequestingAdmin] = useState(false)

  const requestAdminAccess = async () => {
    if (!currentUser) {
      return
    }

    setIsRequestingAdmin(true)
    setRequestError(null)
    setRequestMessage(null)

    try {
      const request = await createAdminRequest(currentUser)

      setRequestMessage(
        request.status === 'pending'
          ? 'Your admin access request has been sent for approval. After approval, sign out and sign back in.'
          : 'Your admin request was created. After approval, sign out and sign back in.',
      )
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : 'Unable to submit the admin access request right now.',
      )
    } finally {
      setIsRequestingAdmin(false)
    }
  }

  return {
    isRequestingAdmin,
    requestAdminAccess,
    requestError,
    requestMessage,
  }
}
