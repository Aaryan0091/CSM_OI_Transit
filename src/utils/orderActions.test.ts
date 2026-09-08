import { describe, expect, it } from 'vitest'
import type { Order, Task, User } from '../types'
import {
  applyOrderUpdates,
  buildNewOrder,
  canCreateOrders,
  canDeleteOrders,
  createOrderId,
  createOrderNumberKey,
  sendTaskBackToPreviousDepartment,
  updateTaskStatusAndAdvance,
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

const salesUser: User = {
  uid: 'sales-1',
  email: 'sales@company.com',
  emailVerified: true,
  name: 'Sales User',
  dept: 'Sales',
}

const procurementUser: User = {
  uid: 'procurement-1',
  email: 'procurement@company.com',
  emailVerified: true,
  name: 'Procurement User',
  dept: 'Procurement',
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
  it('allows only Admin and Sales users to create orders', () => {
    expect(canCreateOrders(adminUser)).toBe(true)
    expect(canCreateOrders(salesUser)).toBe(true)
    expect(canCreateOrders(designUser)).toBe(false)
    expect(canCreateOrders(null)).toBe(false)
  })

  it('allows only Admin and Sales users to delete orders', () => {
    expect(canDeleteOrders(adminUser)).toBe(true)
    expect(canDeleteOrders(salesUser)).toBe(true)
    expect(canDeleteOrders(designUser)).toBe(false)
    expect(canDeleteOrders(null)).toBe(false)
  })

  it('validates required fields when building a new order', () => {
    const result = buildNewOrder({
      orderNumber: 'WO-100',
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
        orderNumber: '  CLIENT-WO/42  ',
        company: 'Oriental',
        client: '  Test Client  ',
        product: '  FRP Cable Tray ',
        description: ' extra ',
        deadline: '2026-08-21',
        priority: 'High',
      },
      { createdAt: '2026-07-11', sequenceNumber: 1000 },
    )

    expect(result.error).toBeNull()
    expect(result.order?.id).toBe('ORD-1000')
    expect(result.order?.sequenceNumber).toBe(1000)
    expect(result.order?.orderNumber).toBe('CLIENT-WO/42')
    expect(result.order?.orderNumberKey).toBe('CLIENT-WO%2F42')
    expect(result.order?.client).toBe('Test Client')
    expect(result.order?.product).toBe('FRP Cable Tray')
    expect(result.order?.tasks).toHaveLength(6)
    expect(result.order?.tasks.map((task) => task.status)).toEqual([
      'In Progress',
      'Pending',
      'Pending',
      'Pending',
      'Pending',
      'Pending',
    ])
  })

  it('formats permanent sequential order IDs without a three-digit limit', () => {
    expect(createOrderId(1)).toBe('ORD-001')
    expect(createOrderId(999)).toBe('ORD-999')
    expect(createOrderId(1000)).toBe('ORD-1000')
    expect(createOrderId(12543)).toBe('ORD-12543')
  })

  it('reserves entered order numbers case-insensitively', () => {
    expect(createOrderNumberKey('Client-WO/42')).toBe('CLIENT-WO%2F42')
    expect(createOrderNumberKey(' client-wo/42 ')).toBe('CLIENT-WO%2F42')
  })

  it('activates the next department when the current department finishes', () => {
    const order = buildNewOrder(
      {
        orderNumber: 'WO-200',
        company: 'CSM',
        client: 'Test Client',
        product: 'Test Product',
        description: '',
        deadline: '2026-08-30',
        priority: 'Medium',
      },
      { id: 'ORD-200' },
    ).order

    expect(order).not.toBeNull()

    const result = updateTaskStatusAndAdvance(order!.tasks, 0, 'Completed')

    expect(result.tasks[0].status).toBe('Completed')
    expect(result.tasks[1].status).toBe('In Progress')
    expect(result.tasks[2].status).toBe('Pending')
    expect(result.nextTaskIndex).toBe(1)
  })

  it('advances through every department and dispatches the completed order', () => {
    const order = buildNewOrder(
      {
        orderNumber: 'WO-201',
        company: 'CSM',
        client: 'Lifecycle Client',
        product: 'Lifecycle Product',
        description: '',
        deadline: '2026-09-30',
        priority: 'High',
      },
      { id: 'ORD-201' },
    ).order!
    let tasks: Task[] = order.tasks

    for (let index = 0; index < tasks.length - 1; index += 1) {
      const result = updateTaskStatusAndAdvance(tasks, index, 'Completed')
      tasks = result.tasks

      expect(tasks[index].status).toBe('Completed')
      expect(tasks[index + 1].status).toBe('In Progress')
      expect(result.nextTaskIndex).toBe(index + 1)
    }

    const dispatched = updateTaskStatusAndAdvance(
      tasks,
      tasks.length - 1,
      'Dispatched',
    )

    expect(dispatched.tasks.at(-1)?.status).toBe('Dispatched')
    expect(dispatched.nextTaskIndex).toBe(tasks.length - 1)
    expect(
      applyOrderUpdates(
        order,
        { deadline: order.deadline, tasks: dispatched.tasks },
        adminUser,
      ).overallStatus,
    ).toBe('Completed')
  })

  it('sends an active order back exactly one department', () => {
    const order = cloneOrder(baseOrder)
    const result = sendTaskBackToPreviousDepartment(order.tasks, 2)

    expect(result.error).toBeNull()
    expect(result.tasks[1].status).toBe('In Progress')
    expect(result.tasks[2].status).toBe('Pending')

    const saved = applyOrderUpdates(
      order,
      { deadline: order.deadline, tasks: result.tasks },
      procurementUser,
    )
    expect(saved.tasks[1].status).toBe('In Progress')
    expect(saved.tasks[2].status).toBe('Pending')
  })

  it('requires a progress remark before sending an order back', () => {
    const order = cloneOrder(baseOrder)
    order.tasks[2].remark = ' '

    const result = sendTaskBackToPreviousDepartment(order.tasks, 2)

    expect(result.error).toBe(
      'Add a Procurement progress remark explaining why the order is being sent back.',
    )
    expect(result.tasks[1].status).toBe('Completed')
    expect(result.tasks[2].status).toBe('In Progress')
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
