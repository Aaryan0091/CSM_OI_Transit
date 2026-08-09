import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { Order } from '../types'
import { normalizeOrder } from '../utils/orders'

export async function saveOrderToFirestore(order: Order) {
  if (!db) {
    return
  }

  await setDoc(doc(db, 'orders', order.id), order)
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
