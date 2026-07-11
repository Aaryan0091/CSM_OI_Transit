import { useEffect, useState } from 'react'
import { AdminAccessGate } from './components/auth/AdminAccessGate'
import { LoginScreen } from './components/auth/LoginScreen'
import { AppHeader } from './components/dashboard/AppHeader'
import { OrdersList } from './components/dashboard/OrdersList'
import { OrdersToolbar } from './components/dashboard/OrdersToolbar'
import { StatsGrid } from './components/dashboard/StatsGrid'
import { StatusBanner } from './components/dashboard/StatusBanner'
import { AddOrderModal } from './components/orders/AddOrderModal'
import { OrderModal } from './components/orders/OrderModal'
import { ADMIN_ACCESS_CODE, INITIAL_ORDERS, THEMES } from './data/constants'
import { isFirebaseConfigured } from './lib/firebase'
import {
  signInWithEmail,
  signOutCurrentUser,
  signUpWithEmail,
  subscribeToAuthChanges,
} from './services/auth'
import { loadOrdersFromFirestore, saveOrderToFirestore } from './services/orders'
import { loadUserProfile } from './services/users'
import type { Company, Department, Order, Task, ThemeMode, User, UserDepartment } from './types'
import { mapAuthError } from './utils/auth'
import { deriveStatus } from './utils/orders'

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [pendingAdminUser, setPendingAdminUser] = useState<User | null>(null)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS)
  const [selected, setSelected] = useState<Order | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [filter, setFilter] = useState<'All' | Order['overallStatus']>('All')
  const [search, setSearch] = useState('')
  const [companyFilter, setCompanyFilter] = useState<'All' | Company>('All')
  const [deptFilter, setDeptFilter] = useState<'All' | Department>('All')
  const [isLoadingOrders, setIsLoadingOrders] = useState(isFirebaseConfigured)
  const [syncError, setSyncError] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(
    isFirebaseConfigured ? null : 'Firebase Auth is not configured yet. Add your Firebase env vars first.',
  )
  const [isCheckingAuth, setIsCheckingAuth] = useState(isFirebaseConfigured)
  const [themeMode, setThemeMode] = useState<ThemeMode>('light')
  const theme = THEMES[themeMode]

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return
    }

    const unsubscribe = subscribeToAuthChanges(async (firebaseUser) => {
      if (!firebaseUser) {
        setCurrentUser(null)
        setPendingAdminUser(null)
        setIsCheckingAuth(false)
        return
      }

      try {
        const profile = await loadUserProfile(firebaseUser)
        if (profile.dept === 'Admin') {
          setPendingAdminUser(profile)
          setCurrentUser(null)
        } else {
          setCurrentUser(profile)
          setPendingAdminUser(null)
        }
        setAuthError(null)
      } catch (error) {
        console.error('Failed to load authenticated user profile:', error)
        setCurrentUser(null)
        setPendingAdminUser(null)
        setAuthError(mapAuthError(error))
        await signOutCurrentUser()
      } finally {
        setIsCheckingAuth(false)
      }
    })

    return () => unsubscribe()
  }, [])

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

  const handleLogin = async (email: string, password: string) => {
    try {
      setAuthError(null)
      await signInWithEmail(email, password)
      return null
    } catch (error) {
      return mapAuthError(error)
    }
  }

  const handleSignup = async (payload: {
    name: string
    dept: UserDepartment
    email: string
    password: string
  }) => {
    try {
      setAuthError(null)
      await signUpWithEmail(payload)
      return null
    } catch (error) {
      return mapAuthError(error)
    }
  }

  const handleAdminUnlock = (code: string) => {
    if (!pendingAdminUser) {
      return 'No admin account is waiting for verification.'
    }

    if (!ADMIN_ACCESS_CODE) {
      return 'Admin access code is not configured yet. Add VITE_ADMIN_ACCESS_CODE to your env file.'
    }

    if (!code) {
      return 'Please enter the admin access code.'
    }

    if (code !== ADMIN_ACCESS_CODE) {
      return 'Incorrect admin access code.'
    }

    setCurrentUser(pendingAdminUser)
    setPendingAdminUser(null)
    setAuthError(null)
    return null
  }

  const handleSignOut = async () => {
    try {
      setAuthError(null)
      await signOutCurrentUser()
      setCurrentUser(null)
      setPendingAdminUser(null)
    } catch (error) {
      console.error('Failed to sign out:', error)
      setAuthError('Unable to sign out right now. Please try again.')
    }
  }

  if (isCheckingAuth) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: theme.pageBg,
          color: theme.text,
          fontFamily: "'Inter', -apple-system, sans-serif",
        }}
      >
        Checking authentication...
      </div>
    )
  }

  if (!currentUser) {
    if (pendingAdminUser) {
      return (
        <AdminAccessGate
          onUnlock={handleAdminUnlock}
          onSignOut={handleSignOut}
          themeMode={themeMode}
          onToggleTheme={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
          externalError={authError}
        />
      )
    }

    return (
      <LoginScreen
        onLogin={handleLogin}
        onSignup={handleSignup}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
        externalError={authError}
      />
    )
  }

  const handleSave = async (
    id: string,
    updates: { tasks: Task[]; deadline: string },
  ) => {
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

  return (
    <div
      style={{
        fontFamily: "'Inter', -apple-system, sans-serif",
        background: theme.pageBg,
        color: theme.text,
        minHeight: '100vh',
      }}
    >
      <AppHeader
        currentUser={currentUser}
        theme={theme}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
        onOpenNewOrder={() => setAddOpen(true)}
        onSignOut={handleSignOut}
      />

      {isLoadingOrders && (
        <StatusBanner message="Loading orders from Firestore..." tone="info" theme={theme} />
      )}

      {!isLoadingOrders && !isFirebaseConfigured && (
        <StatusBanner
          message="Firestore is not configured yet. The app is using local sample data."
          tone="warning"
          theme={theme}
        />
      )}

      {syncError && (
        <StatusBanner message={syncError} tone="error" theme={theme} />
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
        <StatsGrid stats={stats} theme={theme} />
        <OrdersToolbar
          search={search}
          onSearchChange={setSearch}
          filter={filter}
          onFilterChange={setFilter}
          companyFilter={companyFilter}
          onCompanyFilterChange={setCompanyFilter}
          deptFilter={deptFilter}
          onDeptFilterChange={setDeptFilter}
          theme={theme}
        />
        <OrdersList orders={filtered} theme={theme} onSelect={setSelected} />
      </div>

      {selected && (
        <OrderModal
          order={selected}
          onClose={() => setSelected(null)}
          onSave={handleSave}
          currentUser={currentUser}
          theme={theme}
        />
      )}
      {addOpen && currentUser.dept === 'Admin' && (
        <AddOrderModal onClose={() => setAddOpen(false)} onAdd={handleAdd} theme={theme} />
      )}
    </div>
  )
}
