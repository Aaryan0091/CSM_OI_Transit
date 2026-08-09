import { DEPARTMENTS } from '../data/constants'
import type { Department, Order, Task, UserDepartment } from '../types'

export function daysLeft(deadline: string) {
  const today = new Date()
  const [year, month, day] = deadline.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  return Math.ceil((target.getTime() - today.getTime()) / 86400000)
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
  task: Task | (Omit<Task, 'nextDeptRemark' | 'nextDeptRemarkTarget'> & { nextDeptRemark?: string; nextDeptRemarkTarget?: Department | '' }),
): Task {
  return {
    ...task,
    nextDeptRemark: task.nextDeptRemark ?? '',
    nextDeptRemarkTarget: task.nextDeptRemarkTarget ?? '',
  }
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    tasks: order.tasks.map(normalizeTask),
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
