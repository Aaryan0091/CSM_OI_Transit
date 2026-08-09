import { useEffect, useState } from 'react'
import { subscribeToOrderActivity } from '../services/orders'
import type { OrderActivity } from '../types'

export function useOrderActivity(orderId: string) {
  const [activity, setActivity] = useState<OrderActivity[]>([])
  const [error, setError] = useState<string | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)

  useEffect(
    () =>
      subscribeToOrderActivity(
        orderId,
        (nextActivity) => {
          setActivity(nextActivity)
          setError(null)
          setHasLoaded(true)
        },
        (subscriptionError) => {
          console.error('Failed to subscribe to order activity:', subscriptionError)
          setError('Activity history could not be loaded.')
          setHasLoaded(true)
        },
      ),
    [orderId],
  )

  return { activity, error, hasLoaded }
}
