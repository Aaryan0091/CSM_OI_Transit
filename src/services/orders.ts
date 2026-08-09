import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Order, OrderActivity, User } from '../types'
import { describeOrderChanges } from '../utils/orderActivity'
import { normalizeOrder } from '../utils/orders'

export async function saveOrderToFirestore(
  order: Order,
  user: User,
  previousOrder: Order | null,
) {
  if (!db) {
    return
  }

  const orderReference = doc(db, 'orders', order.id)
  const activityReference = doc(collection(orderReference, 'activity'))
  const batch = writeBatch(db)

  batch.set(orderReference, {
    ...order,
    lastActivityId: activityReference.id,
  })
  batch.set(activityReference, {
    actorUid: user.uid,
    actorName: user.name,
    actorDept: user.dept,
    action: previousOrder ? 'updated' : 'created',
    summary: describeOrderChanges(previousOrder, order),
    createdAt: serverTimestamp(),
  })

  await batch.commit()
}

export function subscribeToOrders(
  onOrders: (orders: Order[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) {
    onOrders([])
    return () => {}
  }

  return onSnapshot(
    collection(db, 'orders'),
    (snapshot) => {
      const orders = snapshot.docs.map((entry) => normalizeOrder(entry.data() as Order))

      onOrders(orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt)))
    },
    onError,
  )
}

export function subscribeToOrderActivity(
  orderId: string,
  onActivity: (activity: OrderActivity[]) => void,
  onError: (error: Error) => void,
) {
  if (!db) {
    onActivity([])
    return () => {}
  }

  const activityQuery = query(
    collection(db, 'orders', orderId, 'activity'),
    orderBy('createdAt', 'desc'),
    limit(50),
  )

  return onSnapshot(
    activityQuery,
    (snapshot) => {
      onActivity(
        snapshot.docs.map((entry) => {
          const data = entry.data() as Omit<OrderActivity, 'id' | 'createdAt'> & {
            createdAt?: { toDate?: () => Date }
          }

          return {
            id: entry.id,
            actorUid: data.actorUid,
            actorName: data.actorName,
            actorDept: data.actorDept,
            action: data.action,
            summary: data.summary,
            createdAt: data.createdAt?.toDate?.().toISOString() ?? '',
          }
        }),
      )
    },
    onError,
  )
}
