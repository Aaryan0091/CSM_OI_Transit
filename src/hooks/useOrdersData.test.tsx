import { act, cleanup, render, renderHook, screen, fireEvent } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEMES } from '../data/constants'
import type { Order, User } from '../types'
import { OrdersToolbar } from '../components/dashboard/OrdersToolbar'
import { useOrdersData } from './useOrdersData'

vi.mock('../lib/firebase', () => ({ isFirebaseConfigured: true }))
vi.mock('../services/orders', () => ({
  createOrderInFirestore: vi.fn(),
  deleteOrderFromFirestore: vi.fn(),
  saveOrderToFirestore: vi.fn(),
  subscribeToOrders: (onOrders: (orders: Order[]) => void) => {
    onOrders(orders)
    return vi.fn()
  },
}))

const user: User = {
  uid: 'sales-user', name: 'Sales User', email: 'sales@example.com',
  emailVerified: true, dept: 'Sales',
}
const orders: Order[] = [
  ['ORD-1', 'In Progress', 'CSM', '2026-12-03'],
  ['ORD-2', 'On Hold', 'CSM', '2026-12-01'],
  ['ORD-3', 'Completed', 'CSM', '2026-12-02'],
  ['ORD-4', 'In Progress', 'Oriental', '2026-12-04'],
].map(([id, status, company, deadline]) => ({
  id, overallStatus: status as Order['overallStatus'], company: company as Order['company'],
  client: 'Customer', product: 'Component', description: '', deadline,
  createdAt: '2026-11-02', priority: 'Medium',
  tasks: [{
    dept: 'Sales', status: status as Order['overallStatus'], assignee: '', remark: '',
    nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: status === 'On Hold' ? 'Waiting' : '',
  }],
}))

afterEach(cleanup)

describe('Active Orders filter', () => {
  it('defaults to All and excludes only completed orders when Active Orders is selected', () => {
    const { result } = renderHook(() => useOrdersData(user))
    expect(result.current.filter).toBe('All')
    expect(result.current.filtered).toHaveLength(4)

    act(() => result.current.setFilter('Active Orders'))
    expect(result.current.filtered.map((order) => order.id)).toEqual(['ORD-2', 'ORD-1', 'ORD-4'])
    expect(result.current.stats).toEqual({ total: 4, inProgress: 2, onHold: 1, completed: 1 })

    act(() => result.current.setFilter('Completed'))
    expect(result.current.filtered.map((order) => order.id)).toEqual(['ORD-3'])
    act(() => result.current.setFilter('All'))
    expect(result.current.filtered).toHaveLength(4)
  })

  it('combines with factory, department, search, and sorting filters', () => {
    const { result } = renderHook(() => useOrdersData(user))
    act(() => {
      result.current.setFilter('Active Orders')
      result.current.setCompanyFilter('CSM')
      result.current.setDeptFilter('Sales')
      result.current.setSearch('component')
      result.current.setSort('deadline-desc')
    })
    expect(result.current.filtered.map((order) => order.id)).toEqual(['ORD-1', 'ORD-2'])
    act(() => result.current.setSearch('ORD-2'))
    expect(result.current.filtered.map((order) => order.id)).toEqual(['ORD-2'])
    act(() => result.current.setSearch('no matches'))
    expect(result.current.filtered).toEqual([])
  })

  it.each(['light', 'dark'] as const)('switches the toolbar selection in the %s theme', (mode) => {
    function Toolbar() {
      const data = useOrdersData(user)
      return <OrdersToolbar
        search={data.search} onSearchChange={data.setSearch}
        filter={data.filter} onFilterChange={data.setFilter}
        companyFilter={data.companyFilter} onCompanyFilterChange={data.setCompanyFilter}
        deptFilter={data.deptFilter} onDeptFilterChange={data.setDeptFilter}
        sort={data.sort} onSortChange={data.setSort} theme={THEMES[mode]}
      />
    }
    render(<Toolbar />)
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(screen.getByRole('button', { name: 'Active Orders' }))
    expect(screen.getByRole('button', { name: 'Active Orders' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed')).toBe('false')
  })
})
