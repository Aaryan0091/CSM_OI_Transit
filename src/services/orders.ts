import {
  collection,
  doc,
  getDocFromServer,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { getToken } from 'firebase/app-check'
import { appCheck, auth, db } from '../lib/firebase'
import type { Order, OrderActivity, User } from '../types'
import { describeOrderChanges } from '../utils/orderActivity'
import {
  canCreateOrders,
  createOrderId,
  createOrderNumberKey,
  validateOrderForCreation,
} from '../utils/orderActions'
import { OrderCreationError } from '../utils/orderErrors'
import { normalizeOrder } from '../utils/orders'

const MAX_ACTIVITY_RECORDS_PER_DELETE = 499
const INITIAL_ORDER_SEQUENCE = 999

async function loadFreshOrderCreator(user: User, firestore: NonNullable<typeof db>) {
  const firebaseUser = auth?.currentUser

  if (!firebaseUser || firebaseUser.uid !== user.uid) {
    throw new OrderCreationError(
      'authorization',
      'Your sign-in session changed. Sign out, sign back in, and try again.',
    )
  }

  const tokenResult = await firebaseUser.getIdTokenResult(true)

  if (tokenResult.claims.email_verified !== true) {
    throw new OrderCreationError(
      'authorization',
      'Verify your email address, then sign out and back in before creating an order.',
    )
  }

  const profileSnapshot = await getDocFromServer(doc(firestore, 'users', user.uid))

  if (!profileSnapshot.exists()) {
    throw new OrderCreationError(
      'authorization',
      'Your Firestore user profile is missing. Contact an administrator before creating an order.',
    )
  }

  const profile = profileSnapshot.data()
  const storedProfileName = typeof profile.name === 'string' ? profile.name : ''
  const creator: User = {
    uid: user.uid,
    email: firebaseUser.email ?? user.email,
    emailVerified: true,
    // Firestore rules compare actorName with the stored profile value exactly.
    // Keep legacy whitespace here so an otherwise valid Sales profile is not rejected.
    name: storedProfileName,
    dept: tokenResult.claims.admin === true ? 'Admin' : profile.dept,
  }

  if (!creator.name.trim()) {
    throw new OrderCreationError(
      'authorization',
      'Your Firestore profile name is missing. Contact an administrator before creating an order.',
    )
  }

  if (!canCreateOrders(creator)) {
    throw new OrderCreationError(
      'authorization',
      'Only Admin and Sales users can create new orders.',
    )
  }

  return creator
}

export async function createOrderInFirestore(orderDraft: Order, user: User) {
  const validationError = validateOrderForCreation(orderDraft)

  if (validationError) {
    throw new OrderCreationError('validation', validationError)
  }

  if (!user.emailVerified) {
    throw new OrderCreationError(
      'authorization',
      'Verify your email address, then sign out and back in before creating an order.',
    )
  }

  if (!canCreateOrders(user)) {
    throw new OrderCreationError(
      'authorization',
      'Only Admin and Sales users can create new orders.',
    )
  }

  if (!db) {
    throw new Error('Firebase is not configured.')
  }

  const firestore = db

  if (appCheck) {
    await getToken(appCheck)
  }

  const creator = await loadFreshOrderCreator(user, firestore)

  const counterReference = doc(firestore, 'metadata', 'orderCounter')
  const orderNumber = orderDraft.orderNumber!.trim()

  const orderNumberKey = createOrderNumberKey(orderNumber)
  const reservationReference = doc(
    firestore,
    'orderNumberReservations',
    orderNumberKey,
  )

  return runTransaction(firestore, async (transaction) => {
    const counterSnapshot = await transaction.get(counterReference)
    const reservationSnapshot = await transaction.get(reservationReference)

    if (reservationSnapshot.exists()) {
      throw new OrderCreationError(
        'duplicate',
        'That order number has already been used. Enter a different order number.',
      )
    }

    const storedLastNumber = counterSnapshot.exists()
      ? counterSnapshot.data().lastNumber
      : INITIAL_ORDER_SEQUENCE
    const lastNumber =
      Number.isSafeInteger(storedLastNumber) && storedLastNumber >= INITIAL_ORDER_SEQUENCE
        ? storedLastNumber
        : INITIAL_ORDER_SEQUENCE
    const sequenceNumber = lastNumber + 1
    const order: Order = {
      ...orderDraft,
      id: createOrderId(sequenceNumber),
      sequenceNumber,
      orderNumber: orderDraft.orderNumber?.trim(),
      orderNumberKey,
    }
    const orderReference = doc(firestore, 'orders', order.id)
    const activityReference = doc(collection(orderReference, 'activity'))

    transaction.set(counterReference, {
      lastNumber: sequenceNumber,
      updatedAt: serverTimestamp(),
    })
    transaction.set(reservationReference, {
      orderId: order.id,
      orderNumber: order.orderNumber,
      reservedAt: serverTimestamp(),
      reservedBy: creator.uid,
    })
    transaction.set(orderReference, {
      ...order,
      lastActivityId: activityReference.id,
    })
    transaction.set(activityReference, {
      actorUid: creator.uid,
      actorName: creator.name,
      actorDept: creator.dept,
      action: 'created',
      summary: describeOrderChanges(null, order),
      createdAt: serverTimestamp(),
    })

    return order
  })
}

export async function saveOrderToFirestore(
  order: Order,
  user: User,
  previousOrder: Order | null,
) {
  if (!db) {
    return
  }

  if (appCheck) {
    await getToken(appCheck)
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

export async function deleteOrderFromFirestore(orderId: string) {
  if (!db) {
    return
  }

  if (appCheck) {
    await getToken(appCheck)
  }

  const orderReference = doc(db, 'orders', orderId)
  const activitySnapshot = await getDocs(
    query(
      collection(orderReference, 'activity'),
      limit(MAX_ACTIVITY_RECORDS_PER_DELETE + 1),
    ),
  )

  if (activitySnapshot.size > MAX_ACTIVITY_RECORDS_PER_DELETE) {
    throw new Error(
      'This order has too much activity history for a safe browser deletion. Contact an administrator.',
    )
  }

  const batch = writeBatch(db)

  activitySnapshot.docs.forEach((activityDocument) => {
    batch.delete(activityDocument.ref)
  })
  batch.delete(orderReference)

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
