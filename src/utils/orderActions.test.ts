import { describe, expect, it } from 'vitest'
import type { Order, User } from '../types'
import {
  applyOrderUpdates,
  buildNewOrder,
  canCreateOrders,
  validateOrderTasks,
} from './orderActions'

const adminUser: User = {
  uid: 'admin-1',
  email: 'admin@company.com',
  emailVerified: true,
  name: 'Main Admin',
  dept: 'Admin',
}

const designUser: User = {
  uid: 'design-1',
  email: 'design@company.com',
  emailVerified: true,
  name: 'Design User',
  dept: 'Design',
}

const baseOrder: Order = {
  id: 'ORD-001',
  company: 'CSM',
  client: 'Test Client',
  product: 'FRP Panel',
  description: 'Initial order',
  deadline: '2026-07-15',
  priority: 'High',
  overallStatus: 'In Progress',
  tasks: [
    { dept: 'Sales', status: 'Completed', assignee: 'One', remark: 'Sales complete', nextDeptRemark: 'Handing over to design', nextDeptRemarkTarget: 'Design', holdReason: '' },
    { dept: 'Design', status: 'Completed', assignee: 'Two', remark: 'Design done', nextDeptRemark: 'Ready for procurement', nextDeptRemarkTarget: 'Procurement', holdReason: '' },
    { dept: 'Procurement', status: 'In Progress', assignee: 'Three', remark: 'Ordering material', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Production', status: 'In Progress', assignee: 'Four', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'QC', status: 'In Progress', assignee: 'Five', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
    { dept: 'Dispatch', status: 'In Progress', assignee: '', remark: '', nextDeptRemark: '', nextDeptRemarkTarget: '', holdReason: '' },
  ],
  createdAt: '2026-06-01',
}

function cloneOrder(order: Order) {
  return structuredClone(order)
}

describe('orderActions', () => {
  it('allows only admins to create orders', () => {
    expect(canCreateOrders(adminUser)).toBe(true)
    expect(canCreateOrders(designUser)).toBe(false)
    expect(canCreateOrders(null)).toBe(false)
  })

  it('validates required fields when building a new order', () => {
    const result = buildNewOrder({
      company: 'CSM',
      client: '  ',
      product: '',
      description: '',
      deadline: '',
      priority: 'Medium',
    })

    expect(result.order).toBeNull()
    expect(result.error).toBe('Please enter the client or organisation name.')
  })

  it('builds a trimmed order payload for valid input', () => {
    const result = buildNewOrder(
      {
        company: 'Oriental',
        client: '  Test Client  ',
        product: '  FRP Cable Tray ',
        description: ' extra ',
        deadline: '2026-08-21',
        priority: 'High',
      },
      { createdAt: '2026-07-11', randomValue: 0 },
    )

    expect(result.error).toBeNull()
    expect(result.order?.id).toBe('ORD-100')
    expect(result.order?.client).toBe('Test Client')
    expect(result.order?.product).toBe('FRP Cable Tray')
    expect(result.order?.tasks).toHaveLength(6)
  })

  it('requires a hold reason when a task is on hold', () => {
    const tasks = cloneOrder(baseOrder).tasks
    tasks[2].status = 'On Hold'
    tasks[2].holdReason = ' '

    expect(validateOrderTasks(tasks)).toBe(
      'Procurement is on hold, so a hold reason is required.',
    )
  })

  it('lets admins update every task and the deadline', () => {
    const order = cloneOrder(baseOrder)
    const updated = applyOrderUpdates(
      order,
      {
        deadline: '2026-08-30',
        tasks: order.tasks.map((task) =>
          task.dept === 'Procurement'
            ? { ...task, status: 'Completed', holdReason: '' }
            : task,
        ),
      },
      adminUser,
    )

    expect(updated.deadline).toBe('2026-08-30')
    expect(updated.tasks.find((task) => task.dept === 'Procurement')?.status).toBe('Completed')
  })

  it('lets non-admin users update only their own department', () => {
    const order = cloneOrder(baseOrder)
    const updatedTasks = order.tasks.map((task) => {
      if (task.dept === 'Design') {
        return { ...task, remark: 'Updated by design', status: 'Completed' as const }
      }

      if (task.dept === 'Sales') {
        return { ...task, remark: 'Attempted sales overwrite' }
      }

      return task
    })

    const updated = applyOrderUpdates(
      order,
      {
        deadline: '2030-01-01',
        tasks: updatedTasks,
      },
      designUser,
    )

    expect(updated.deadline).toBe(order.deadline)
    expect(updated.tasks.find((task) => task.dept === 'Design')?.remark).toBe('Updated by design')
    expect(updated.tasks.find((task) => task.dept === 'Sales')?.remark).toBe(
      order.tasks.find((task) => task.dept === 'Sales')?.remark,
    )
  })
})
