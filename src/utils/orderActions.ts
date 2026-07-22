import { DEPARTMENTS } from '../data/constants'
import type { Company, Order, Priority, Task, User } from '../types'
import { deriveStatus } from './orders'

export type NewOrderForm = {
  company: Company
  client: string
  product: string
  description: string
  deadline: string
  priority: Priority
}

export function canCreateOrders(user: User | null) {
  return user?.dept === 'Admin'
}

export function validateNewOrderForm(form: NewOrderForm) {
  if (!form.client.trim()) {
    return 'Please enter the client or organisation name.'
  }

  if (!form.product.trim()) {
    return 'Please enter the product name.'
  }

  if (!form.deadline.trim()) {
    return 'Please choose a deadline before adding the order.'
  }

  return null
}

export function createOrderId(randomValue = Math.random()) {
  return `ORD-${String(Math.floor(randomValue * 900) + 100)}`
}

export function buildNewOrder(
  form: NewOrderForm,
  options?: {
    createdAt?: string
    id?: string
    randomValue?: number
  },
) {
  const validationError = validateNewOrderForm(form)

  if (validationError) {
    return { error: validationError, order: null }
  }

  return {
    error: null,
    order: {
      id: options?.id ?? createOrderId(options?.randomValue),
      company: form.company,
      client: form.client.trim(),
      product: form.product.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
      priority: form.priority,
      overallStatus: 'In Progress',
      tasks: DEPARTMENTS.map((dept) => ({
        dept,
        status: 'In Progress',
        assignee: '',
        remark: '',
        nextDeptRemark: '',
        nextDeptRemarkTarget: '',
        holdReason: '',
      })),
      createdAt: options?.createdAt ?? new Date().toISOString().split('T')[0],
    } satisfies Order,
  }
}

export function validateOrderTasks(tasks: Task[]) {
  const blockedTask = tasks.find(
    (task) => task.status === 'On Hold' && !task.holdReason.trim(),
  )

  if (blockedTask) {
    return `${blockedTask.dept} is on hold, so a hold reason is required.`
  }

  return null
}

export function applyOrderUpdates(
  order: Order,
  updates: { deadline: string; tasks: Task[] },
  currentUser: User | null,
) {
  if (!currentUser) {
    throw new Error('You must be signed in to update orders.')
  }

  const userCanEditAnyTask = currentUser.dept === 'Admin'
  const userTaskExists = order.tasks.some((task) => task.dept === currentUser.dept)

  if (!userCanEditAnyTask && !userTaskExists) {
    throw new Error('You can only update tasks for your department.')
  }

  const mergedTasks = userCanEditAnyTask
    ? updates.tasks
    : order.tasks.map((task) => {
        const nextTask = updates.tasks.find((candidate) => candidate.dept === task.dept)

        if (!nextTask || task.dept !== currentUser.dept) {
          return task
        }

        return nextTask
      })

  const taskValidationError = validateOrderTasks(mergedTasks)

  if (taskValidationError) {
    throw new Error(taskValidationError)
  }

  if (userCanEditAnyTask && !updates.deadline.trim()) {
    throw new Error('Please choose a deadline before saving this order.')
  }

  return {
    ...order,
    tasks: mergedTasks,
    deadline: userCanEditAnyTask ? updates.deadline : order.deadline,
    overallStatus: deriveStatus(mergedTasks),
  }
}
