import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import {
  deleteOrderFromFirestore,
  saveOrderToFirestore,
  subscribeToOrders,
} from '../services/orders'
import type { Company, Department, Order, Task, User } from '../types'
import {
  applyOrderUpdates,
  canCreateOrders,
  canDeleteOrders,
} from '../utils/orderActions'

export function useOrdersData(currentUser: User | null) {
  const currentUserId = currentUser?.uid
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<'All' | Order['overallStatus']>('All')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<'All' | Company>('All')
  const [deptFilter, setDeptFilter] = useState<'All' | Department>('All')
  const [loadedForUserId, setLoadedForUserId] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!isFirebaseConfigured || !currentUserId) {
      return
    }

    return subscribeToOrders(
      (firestoreOrders) => {
        setOrders(firestoreOrders)
        setLoadedForUserId(currentUserId)
        setSelected((previous) =>
          previous
            ? firestoreOrders.find((order) => order.id === previous.id) ?? null
            : null,
        )
        setSyncError(null)
      },
      (error) => {
        console.error('Failed to subscribe to Firestore orders:', error)
        setOrders([])
        setLoadedForUserId(currentUserId)
        setSyncError('Live order updates stopped. Check your connection and sign in again.')
      },
    )
  }, [currentUserId])

  const hasLoadedCurrentUser = Boolean(
    currentUserId && loadedForUserId === currentUserId,
  )
  const visibleOrders = hasLoadedCurrentUser ? orders : []
  const isLoadingOrders = Boolean(
    isFirebaseConfigured && currentUserId && !hasLoadedCurrentUser,
  )

  const handleSave = async (
    id: string,
    updates: { tasks: Task[]; deadline: string },
  ): Promise<string | null> => {
    if (!currentUser) {
      const message = 'Please sign in again before saving order changes.'
      setSyncError(message)
      return message
    }

    const originalOrder = orders.find((order) => order.id === id)

    if (!originalOrder) {
      const message = 'This order is no longer available. Please refresh and try again.'
      setSyncError(message)
      return message
    }

    let updatedOrder: Order

    try {
      updatedOrder = applyOrderUpdates(originalOrder, updates, currentUser)
      setOrders((previous) =>
        previous.map((order) => (order.id === id ? updatedOrder : order)),
      )
      setSyncError(null)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save this order right now.'
      setSyncError(message)
      return message
    }

    if (!isFirebaseConfigured) {
      const message = 'Firebase is not configured, so order changes cannot be saved.'
      setOrders((previous) =>
        previous.map((order) => (order.id === id ? originalOrder : order)),
      )
      setSyncError(message)
      return message
    }

    try {
      await saveOrderToFirestore(updatedOrder, currentUser, originalOrder)
      setSyncError(null)
      setSelected(null)
      return null
    } catch (error) {
      console.error('Failed to save Firestore order:', error)
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''
      const message = errorCode.includes('appCheck/') || errorCode.includes('app-check/')
        ? 'App Check rejected this browser. Register its private localhost debug token or use the production site.'
        : errorCode.includes('permission-denied')
          ? 'Firestore rules denied this update. Confirm the latest rules are deployed and sign in again.'
        : errorCode.includes('unavailable') || errorCode.includes('network')
          ? 'Firestore is temporarily unavailable. Check your connection and try again.'
          : 'Order changes could not be saved to Firestore. Please try again.'

      setOrders((previous) =>
        previous.map((order) => (order.id === id ? originalOrder : order)),
      )
      setSyncError(message)
      return message
    }
  }

  const handleAdd = async (order: Order) => {
    if (!currentUser || !canCreateOrders(currentUser)) {
      setSyncError('Only admins can create new orders.')
      return
    }

    setOrders((previous) => [order, ...previous])
    setAddOpen(false)
    setSyncError(null)

    if (!isFirebaseConfigured) {
      setSyncError('Firebase is not configured, so new orders cannot be saved yet.')
      return
    }

    try {
      await saveOrderToFirestore(order, currentUser, null)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to create Firestore order:', error)
      setOrders((previous) => previous.filter((existing) => existing.id !== order.id))
      setSyncError('The new order could not be created in Firestore.')
    }
  }

  const handleDelete = async (id: string): Promise<string | null> => {
    if (!currentUser || !canDeleteOrders(currentUser)) {
      const message = 'Only Admin and Sales users can delete orders.'
      setSyncError(message)
      return message
    }

    if (!orders.some((order) => order.id === id)) {
      const message = 'This order is no longer available. Please refresh and try again.'
      setSyncError(message)
      return message
    }

    if (!isFirebaseConfigured) {
      const message = 'Firebase is not configured, so this order cannot be deleted.'
      setSyncError(message)
      return message
    }

    try {
      await deleteOrderFromFirestore(id)
      setOrders((previous) => previous.filter((order) => order.id !== id))
      setSelected(null)
      setSyncError(null)
      return null
    } catch (error) {
      console.error('Failed to delete Firestore order:', error)
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? String(error.code)
          : ''
      const message =
        error instanceof Error && error.message.includes('too much activity history')
          ? error.message
          : errorCode.includes('appCheck/') || errorCode.includes('app-check/')
            ? 'App Check rejected this browser. Register its private localhost debug token and try again.'
          : errorCode.includes('permission-denied')
            ? 'Firestore rules denied this deletion. Publish the delete rules for project csm-oi-transit, then try again.'
            : 'The order could not be deleted from Firestore. Please try again.'

      setSyncError(message)
      return message
    }
  }

  const filtered = visibleOrders.filter((order) => {
    const query = search.toLowerCase()
    const matchStatus = filter === 'All' || order.overallStatus === filter
    const matchCompany = companyFilter === 'All' || order.company === companyFilter
    const matchSearch =
      !search ||
      order.client.toLowerCase().includes(query) ||
      order.product.toLowerCase().includes(query) ||
      order.id.toLowerCase().includes(query)
    const matchDept =
      deptFilter === 'All' ||
      order.tasks.some(
        (task) =>
          task.dept === deptFilter &&
          (task.status === 'In Progress' || task.status === 'On Hold'),
      )

    return matchStatus && matchCompany && matchSearch && matchDept
  })

  const stats = {
    total: visibleOrders.length,
    inProgress: visibleOrders.filter((order) => order.overallStatus === 'In Progress').length,
    onHold: visibleOrders.filter((order) => order.overallStatus === 'On Hold').length,
    completed: visibleOrders.filter((order) => order.overallStatus === 'Completed').length,
  }

  return {
    addOpen,
    companyFilter,
    deptFilter,
    filter,
    filtered,
    handleAdd,
    handleDelete,
    handleSave,
    isLoadingOrders,
    search,
    selected,
    setAddOpen,
    setCompanyFilter,
    setDeptFilter,
    setFilter,
    setSearch,
    setSelected,
    stats,
    syncError,
  }
}
