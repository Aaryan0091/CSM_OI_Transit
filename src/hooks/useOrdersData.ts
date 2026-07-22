import { useEffect, useState } from 'react'
import { isFirebaseConfigured } from '../lib/firebase'
import { loadOrdersFromFirestore, saveOrderToFirestore } from '../services/orders'
import type { Company, Department, Order, Task, User } from '../types'
import { applyOrderUpdates, canCreateOrders } from '../utils/orderActions'

export function useOrdersData(currentUser: User | null) {
  const [orders, setOrders] = useState<Order[]>([])
  const [selected, setSelected] = useState<Order | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<'All' | Order['overallStatus']>('All')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<'All' | Company>('All')
  const [deptFilter, setDeptFilter] = useState<'All' | Department>('All')
  const [isLoadingOrders, setIsLoadingOrders] = useState(isFirebaseConfigured)
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function bootstrapOrders() {
      if (!isFirebaseConfigured) {
        setIsLoadingOrders(false)
        return
      }

      try {
        const firestoreOrders = await loadOrdersFromFirestore()

        if (!cancelled) {
          setOrders(firestoreOrders)
          setSyncError(null)
        }
      } catch (error) {
        console.error('Failed to load Firestore orders:', error)

        if (!cancelled) {
          setOrders([])
          setSyncError('Could not load Firestore orders. Check your Firebase rules and connection.')
        }
      } finally {
        if (!cancelled) {
          setIsLoadingOrders(false)
        }
      }
    }

    bootstrapOrders()

    return () => {
      cancelled = true
    }
  }, [])

  const handleSave = async (
    id: string,
    updates: { tasks: Task[]; deadline: string },
  ) => {
    if (!currentUser) {
      setSyncError('Please sign in again before saving order changes.')
      return
    }

    let updatedOrder: Order | null = null

    try {
      setOrders((previous) =>
        previous.map((order) => {
          if (order.id !== id) {
            return order
          }

          updatedOrder = applyOrderUpdates(order, updates, currentUser)
          return updatedOrder
        }),
      )
      setSyncError(null)
    } catch (error) {
      setSyncError(error instanceof Error ? error.message : 'Unable to save this order right now.')
      return
    }

    setSelected(null)

    if (!updatedOrder || !isFirebaseConfigured) {
      return
    }

    try {
      await saveOrderToFirestore(updatedOrder)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to save Firestore order:', error)
      setSyncError('Order changes could not be saved to Firestore.')
    }
  }

  const handleAdd = async (order: Order) => {
    if (!canCreateOrders(currentUser)) {
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
      await saveOrderToFirestore(order)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to create Firestore order:', error)
      setOrders((previous) => previous.filter((existing) => existing.id !== order.id))
      setSyncError('The new order could not be created in Firestore.')
    }
  }

  const filtered = orders.filter((order) => {
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
    total: orders.length,
    inProgress: orders.filter((order) => order.overallStatus === 'In Progress').length,
    onHold: orders.filter((order) => order.overallStatus === 'On Hold').length,
    completed: orders.filter((order) => order.overallStatus === 'Completed').length,
  }

  return {
    addOpen,
    companyFilter,
    deptFilter,
    filter,
    filtered,
    handleAdd,
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
