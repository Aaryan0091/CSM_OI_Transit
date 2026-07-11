import type { Order, Theme } from '../../types'
import { OrderCard } from './OrderCard'

export function OrdersList({
  orders,
  theme,
  onSelect,
}: {
  orders: Order[]
  theme: Theme
  onSelect: (order: Order) => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: theme.textSoft, fontSize: 14 }}>
          No orders match your filters.
        </div>
      )}

      {orders.map((order) => (
        <OrderCard key={order.id} order={order} theme={theme} onSelect={onSelect} />
      ))}
    </div>
  )
}
