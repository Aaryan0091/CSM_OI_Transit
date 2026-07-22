import { collection, doc, getDocs, setDoc } from 'firebase/firestore/lite'
import { db } from '../lib/firebase'
import type { Order } from '../types'
import { normalizeOrder } from '../utils/orders'

export async function saveOrderToFirestore(order: Order) {
  if (!db) {
    return
  }

  await setDoc(doc(db, 'orders', order.id), order)
}

export async function loadOrdersFromFirestore() {
  if (!db) {
    return []
  }

  const snapshot = await getDocs(collection(db, 'orders'))
  const orders = snapshot.docs.map((entry) => normalizeOrder(entry.data() as Order))

  return orders.sort((left, right) => right.createdAt.localeCompare(left.createdAt))
}
