import { LoginScreen } from './components/auth/LoginScreen'
import { AppHeader } from './components/dashboard/AppHeader'
import { OrdersList } from './components/dashboard/OrdersList'
import { OrdersToolbar } from './components/dashboard/OrdersToolbar'
import { StatsGrid } from './components/dashboard/StatsGrid'
import { StatusBanner } from './components/dashboard/StatusBanner'
import { AddOrderModal } from './components/orders/AddOrderModal'
import { OrderModal } from './components/orders/OrderModal'
import { THEMES } from './data/constants'
import { isFirebaseConfigured } from './lib/firebase'
import { useAdminRequest } from './hooks/useAdminRequest'
import { useAuthSession } from './hooks/useAuthSession'
import { useOrdersData } from './hooks/useOrdersData'

export default function App() {
  const {
    authError,
    authMessage,
    currentUser,
    handleLogin,
    handlePasswordReset,
    handleRefreshVerification,
    handleSendVerificationEmail,
    handleSignOut,
    handleSignup,
    isCheckingAuth,
    isRefreshingVerification,
    isSendingVerification,
    pendingVerificationEmail,
    setThemeMode,
    themeMode,
  } = useAuthSession()
  const theme = THEMES[themeMode]
  const {
    isRequestingAdmin,
    requestAdminAccess,
    requestError,
    requestMessage,
  } = useAdminRequest(currentUser)
  const {
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
  } = useOrdersData(currentUser)

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
    return (
      <LoginScreen
        onLogin={handleLogin}
        onPasswordReset={handlePasswordReset}
        onRefreshVerification={handleRefreshVerification}
        onResendVerification={handleSendVerificationEmail}
        onSignOut={handleSignOut}
        onSignup={handleSignup}
        pendingVerificationEmail={pendingVerificationEmail}
        isRefreshingVerification={isRefreshingVerification}
        isSendingVerification={isSendingVerification}
        themeMode={themeMode}
        onToggleTheme={() => setThemeMode((previous) => (previous === 'light' ? 'dark' : 'light'))}
        externalError={authError}
        externalMessage={authMessage}
      />
    )
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
        onRequestAdminAccess={requestAdminAccess}
        onSignOut={handleSignOut}
        isRequestingAdmin={isRequestingAdmin}
      />

      {isLoadingOrders && (
        <StatusBanner message="Loading orders from Firestore..." tone="info" theme={theme} />
      )}

      {!isLoadingOrders && !isFirebaseConfigured && (
        <StatusBanner
          message="Firestore is not configured yet. Connect Firebase to load and save real orders."
          tone="warning"
          theme={theme}
        />
      )}

      {syncError && (
        <StatusBanner message={syncError} tone="error" theme={theme} />
      )}

      {authMessage && (
        <StatusBanner message={authMessage} tone="info" theme={theme} />
      )}

      {requestError && (
        <StatusBanner message={requestError} tone="error" theme={theme} />
      )}

      {requestMessage && (
        <StatusBanner message={requestMessage} tone="info" theme={theme} />
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
