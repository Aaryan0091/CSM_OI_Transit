import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { THEMES } from '../../data/constants'
import type { Order, User } from '../../types'
import { OrderModal } from './OrderModal'

vi.mock('./OrderActivityTimeline', () => ({
  OrderActivityTimeline: () => null,
}))

const order: Order = {
  id: 'ORD-DELETE',
  company: 'CSM',
  client: 'Delete Test',
  product: 'Test Product',
  description: '',
  deadline: '2026-08-30',
  priority: 'Medium',
  overallStatus: 'In Progress',
  tasks: [
    { dept: 'Sales', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Design', status: 'Pending', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Procurement', status: 'Pending', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Production', status: 'Pending', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'QC', status: 'Pending', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Dispatch', status: 'Pending', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
  ],
  createdAt: '2026-08-14',
}

function user(dept: User['dept']): User {
  return {
    uid: `${dept.toLowerCase()}-user`,
    email: `${dept.toLowerCase()}@company.com`,
    emailVerified: true,
    name: `${dept} User`,
    dept,
  }
}

function renderModal(
  currentUser: User,
  onDelete: (id: string) => Promise<string | null> = vi.fn(async () => null),
) {
  render(
    <OrderModal
      order={order}
      onClose={vi.fn()}
      onDelete={onDelete}
      onSave={vi.fn(async () => null)}
      currentUser={currentUser}
      theme={THEMES.light}
    />,
  )

  return onDelete
}

describe('OrderModal deletion', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('shows deletion only to Admin and Sales users', () => {
    const { unmount } = render(
      <OrderModal
        order={order}
        onClose={vi.fn()}
        onDelete={vi.fn(async () => null)}
        onSave={vi.fn(async () => null)}
        currentUser={user('Admin')}
        theme={THEMES.light}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Delete Order' })).not.toBeNull()
    unmount()

    const salesRender = renderModal(user('Sales'))
    expect(screen.queryByRole('button', { name: 'Delete Order' })).not.toBeNull()
    expect(salesRender).not.toHaveBeenCalled()
  })

  it('hides deletion from other departments', () => {
    renderModal(user('Design'))

    expect(screen.queryByRole('button', { name: 'Delete Order' })).toBeNull()
  })

  it('does not delete when confirmation is cancelled', () => {
    const onDelete = renderModal(user('Sales'))

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }))
    const confirmationDialog = screen.getByRole('alertdialog')
    expect(confirmationDialog).not.toBeNull()
    expect(screen.getByRole('heading', { name: 'Delete “Delete Test”?' })).not.toBeNull()
    expect(confirmationDialog.textContent).toContain('Order ORD-DELETE')
    fireEvent.click(screen.getByRole('button', { name: 'Keep Order' }))

    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).toBeNull()
  })

  it('deletes the selected order after confirmation', async () => {
    const onDelete = renderModal(user('Admin'))

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }))

    await waitFor(() => expect(onDelete).toHaveBeenCalledWith('ORD-DELETE'))
  })

  it('keeps the dialog open and shows the Firestore error when deletion fails', async () => {
    const onDelete = vi.fn(async () => 'Firestore rules denied this deletion.')
    renderModal(user('Admin'), onDelete)

    fireEvent.click(screen.getByRole('button', { name: 'Delete Order' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete Permanently' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Firestore rules denied this deletion.',
    )
    expect(screen.queryByRole('alertdialog')).not.toBeNull()
    expect(
      (screen.getByRole('button', { name: 'Delete Permanently' }) as HTMLButtonElement).disabled,
    ).toBe(false)
  })
})
