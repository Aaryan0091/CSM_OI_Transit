import { DEPARTMENTS } from '../data/constants'
import type { Company, Order, Priority, Task, User } from '../types'
import { deriveStatus } from './orders'

export type NewOrderForm = {
  orderNumber: string
  company: Company
  client: string
  product: string
  description: string
  deadline: string
  priority: Priority
}

export function canCreateOrders(user: User | null) {
  return user?.dept === 'Admin' || user?.dept === 'Sales'
}

export function canDeleteOrders(user: User | null) {
  return user?.dept === 'Admin' || user?.dept === 'Sales'
}

export function validateNewOrderForm(form: NewOrderForm) {
  if (!form.orderNumber.trim()) {
    return 'Please enter the order number.'
  }

  if (form.orderNumber.trim().length > 100) {
    return 'The order number must be 100 characters or fewer.'
  }

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

export function createOrderId(sequenceNumber: number) {
  return `ORD-${String(sequenceNumber).padStart(3, '0')}`
}

export function createOrderNumberKey(orderNumber: string) {
  return encodeURIComponent(orderNumber.trim().toUpperCase()).replaceAll('.', '%2E')
}

export function buildNewOrder(
  form: NewOrderForm,
  options?: {
    createdAt?: string
    id?: string
    sequenceNumber?: number
  },
) {
  const validationError = validateNewOrderForm(form)

  if (validationError) {
    return { error: validationError, order: null }
  }

  return {
    error: null,
    order: {
      id: options?.id ?? (options?.sequenceNumber ? createOrderId(options.sequenceNumber) : ''),
      ...(options?.sequenceNumber ? { sequenceNumber: options.sequenceNumber } : {}),
      orderNumber: form.orderNumber.trim(),
      orderNumberKey: createOrderNumberKey(form.orderNumber),
      company: form.company,
      client: form.client.trim(),
      product: form.product.trim(),
      description: form.description.trim(),
      deadline: form.deadline,
      priority: form.priority,
      overallStatus: 'In Progress',
      tasks: DEPARTMENTS.map((dept, index) => ({
        dept,
        status: index === 0 ? 'In Progress' : 'Pending',
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

export function updateTaskStatusAndAdvance(
  tasks: Task[],
  taskIndex: number,
  status: Task['status'],
) {
  const nextTasks = tasks.map((task) => ({ ...task }))
  const currentTask = nextTasks[taskIndex]

  if (!currentTask) {
    return { nextTaskIndex: taskIndex, tasks: nextTasks }
  }

  currentTask.status = status

  if (status !== 'On Hold') {
    currentTask.holdReason = ''
  }

  const isFinished = status === 'Completed' || status === 'Dispatched'
  const nextTask = nextTasks[taskIndex + 1]

  if (isFinished && nextTask?.status === 'Pending') {
    nextTask.status = 'In Progress'
  }

  return {
    nextTaskIndex: isFinished && nextTask ? taskIndex + 1 : taskIndex,
    tasks: nextTasks,
  }
}

export function sendTaskBackToPreviousDepartment(tasks: Task[], taskIndex: number) {
  const nextTasks = tasks.map((task) => ({ ...task }))
  const currentTask = nextTasks[taskIndex]
  const previousTask = nextTasks[taskIndex - 1]

  if (!currentTask || !previousTask) {
    return {
      error: 'Sales is the first department and cannot send an order back.',
      tasks: nextTasks,
    }
  }

  if (currentTask.status !== 'In Progress' && currentTask.status !== 'On Hold') {
    return {
      error: `${currentTask.dept} can send the order back only while it is active.`,
      tasks: nextTasks,
    }
  }

  if (previousTask.status !== 'Completed') {
    return {
      error: `${previousTask.dept} must be completed before this order can be sent back.`,
      tasks: nextTasks,
    }
  }

  if (!currentTask.remark.trim()) {
    return {
      error: `Add a ${currentTask.dept} progress remark explaining why the order is being sent back.`,
      tasks: nextTasks,
    }
  }

  previousTask.status = 'In Progress'
  currentTask.status = 'Pending'
  currentTask.holdReason = ''

  return { error: null, tasks: nextTasks }
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
  const userTaskIndex = order.tasks.findIndex((task) => task.dept === currentUser.dept)
  const userTaskExists = userTaskIndex >= 0

  if (!userCanEditAnyTask && !userTaskExists) {
    throw new Error('You can only update tasks for your department.')
  }

  const requestedUserTask = updates.tasks[userTaskIndex]
  const requestedPreviousTask = updates.tasks[userTaskIndex - 1]
  const originalUserTask = order.tasks[userTaskIndex]
  const originalPreviousTask = order.tasks[userTaskIndex - 1]
  const includesValidSendBack = Boolean(
    !userCanEditAnyTask &&
      userTaskIndex > 0 &&
      originalUserTask &&
      requestedUserTask &&
      originalPreviousTask &&
      requestedPreviousTask &&
      (originalUserTask.status === 'In Progress' || originalUserTask.status === 'On Hold') &&
      requestedUserTask.status === 'Pending' &&
      originalPreviousTask.status === 'Completed' &&
      requestedPreviousTask.status === 'In Progress' &&
      requestedPreviousTask.assignee === originalPreviousTask.assignee &&
      requestedPreviousTask.remark === originalPreviousTask.remark &&
      requestedPreviousTask.nextDeptRemark === originalPreviousTask.nextDeptRemark &&
      requestedPreviousTask.nextDeptRemarkTarget === originalPreviousTask.nextDeptRemarkTarget &&
      requestedPreviousTask.holdReason === originalPreviousTask.holdReason,
  )
  const mergedTasks = userCanEditAnyTask
    ? updates.tasks
    : order.tasks.map((task, taskIndex) => {
        const nextTask = updates.tasks.find((candidate) => candidate.dept === task.dept)

        const isOwnTask = task.dept === currentUser.dept
        const isPreviousSendBackTask = includesValidSendBack && taskIndex === userTaskIndex - 1

        if (!nextTask || (!isOwnTask && !isPreviousSendBackTask)) {
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
