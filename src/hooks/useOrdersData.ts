import { useEffect, useState } from 'react'
import { INITIAL_ORDERS } from '../data/constants'
import { isFirebaseConfigured } from '../lib/firebase'
import { loadOrdersFromFirestore, saveOrderToFirestore } from '../services/orders'
import type { Company, Department, Order, Task, User } from '../types'
import { deriveStatus } from '../utils/orders'

export function useOrdersData(currentUser: User | null) {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
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
          setOrders(INITIAL_ORDERS)
          setSyncError('Could not load Firestore data. Showing local sample orders instead.')
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
      return
    }

    let updatedOrder: Order | null = null

    setOrders((previous) =>
      previous.map((order) => {
        if (order.id !== id) {
          return order
        }

        const mergedTasks =
          currentUser.dept === 'Admin'
            ? updates.tasks
            : order.tasks.map((task) => {
                const nextTask = updates.tasks.find((candidate) => candidate.dept === task.dept)

                if (!nextTask || task.dept !== currentUser.dept) {
                  return task
                }

                return nextTask
              })

        updatedOrder = {
          ...order,
          tasks: mergedTasks,
          deadline: currentUser.dept === 'Admin' ? updates.deadline : order.deadline,
          overallStatus: deriveStatus(mergedTasks),
        }
        return updatedOrder
      }),
    )
    setSelected(null)

    if (!updatedOrder || !isFirebaseConfigured) {
      return
    }

    try {
      await saveOrderToFirestore(updatedOrder)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to save Firestore order:', error)
      setSyncError('Order changes were saved locally, but Firestore sync failed.')
    }
  }

  const handleAdd = async (order: Order) => {
    setOrders((previous) => [order, ...previous])
    setAddOpen(false)

    if (!isFirebaseConfigured) {
      return
    }

    try {
      await saveOrderToFirestore(order)
      setSyncError(null)
    } catch (error) {
      console.error('Failed to create Firestore order:', error)
      setSyncError('The new order was added locally, but Firestore sync failed.')
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
