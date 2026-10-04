import { DEPARTMENTS } from '../data/constants'
import type { Department, Order, Task, UserDepartment } from '../types'

export function daysLeft(deadline: string) {
  const today = new Date()
  const [year, month, day] = deadline.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
}

const ISO_DATE_PATTERN = /\b(\d{4})-(\d{2})-(\d{2})\b/g

// Dates are stored as yyyy-mm-dd (required by date inputs, sorting, and Firestore rules)
// and only shown to users as dd-mm-yyyy.
export function formatDate(isoDate: string) {
  return isoDate.replace(ISO_DATE_PATTERN, '$3-$2-$1')
}

export function formatDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const pad = (part: number) => String(part).padStart(2, '0')

  return `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}, ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export type OrderSort = 'deadline-asc' | 'deadline-desc' | 'newest'

export const ORDER_SORT_OPTIONS: { value: OrderSort; label: string }[] = [
  { value: 'deadline-asc', label: 'Deadline: nearest first' },
  { value: 'deadline-desc', label: 'Deadline: farthest first' },
  { value: 'newest', label: 'Newest orders first' },
]

// Deadlines are yyyy-mm-dd strings, so string comparison matches date order.
export function sortOrders(orders: Order[], sort: OrderSort) {
  return [...orders].sort((left, right) => {
    if (sort !== 'newest') {
      const byDeadline = left.deadline.localeCompare(right.deadline)

      if (byDeadline !== 0) {
        return sort === 'deadline-asc' ? byDeadline : -byDeadline
      }
    }

    return right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id)
  })
}

export function progressPct(tasks: Task[]) {
  const done = tasks.filter((task) => task.status === 'Completed' || task.status === 'Dispatched').length
  return Math.round((done / tasks.length) * 100)
}

export function pipelineProgressPct(tasks: Task[]) {
  if (tasks.length <= 1) {
    return tasks[0]?.status === 'Completed' || tasks[0]?.status === 'Dispatched' ? 100 : 0
  }

  const activeIndex = tasks.findIndex(
    (task) => task.status === 'In Progress' || task.status === 'On Hold',
  )
  const lastCompletedIndex = tasks.reduce(
    (lastIndex, task, index) =>
      task.status === 'Completed' || task.status === 'Dispatched' ? index : lastIndex,
    -1,
  )
  const workflowIndex = activeIndex >= 0 ? activeIndex : Math.max(lastCompletedIndex, 0)

  return Math.min(100, Math.max(0, (workflowIndex / (tasks.length - 1)) * 100))
}

export function normalizeTask(
  task: Task | (
    Omit<Task, 'holdReason' | 'nextDeptRemark' | 'nextDeptRemarkTarget'> & {
      holdReason?: string
      nextDeptRemark?: string
      nextDeptRemarkTarget?: Department | ''
    }
  ),
): Task {
  return {
    dept: task.dept,
    status: task.status,
    assignee: task.assignee ?? '',
    remark: task.remark ?? '',
    holdReason: task.holdReason ?? '',
    nextDeptRemark: task.nextDeptRemark ?? '',
    nextDeptRemarkTarget: task.nextDeptRemarkTarget ?? '',
  }
}

export function normalizeOrder(order: Order): Order {
  return {
    id: order.id,
    ...(typeof order.sequenceNumber === 'number' ? { sequenceNumber: order.sequenceNumber } : {}),
    ...(order.orderNumber ? { orderNumber: order.orderNumber } : {}),
    ...(order.orderNumberKey ? { orderNumberKey: order.orderNumberKey } : {}),
    company: order.company,
    client: order.client,
    product: order.product,
    description: order.description ?? '',
    deadline: order.deadline,
    priority: order.priority,
    overallStatus: order.overallStatus,
    tasks: order.tasks.map(normalizeTask),
    createdAt: order.createdAt,
    ...(order.lastActivityId ? { lastActivityId: order.lastActivityId } : {}),
  }
}

export function isUserDepartment(value: unknown): value is UserDepartment {
  return value === 'Admin' || DEPARTMENTS.includes(value as Department)
}

export function deriveStatus(tasks: Task[]): Order['overallStatus'] {
  if (tasks.every((task) => task.status === 'Completed' || task.status === 'Dispatched')) {
    return 'Completed'
  }

  if (tasks.some((task) => task.status === 'On Hold')) {
    return 'On Hold'
  }

  if (tasks.some((task) => task.status === 'In Progress')) {
    return 'In Progress'
  }

  return 'In Progress'
}
