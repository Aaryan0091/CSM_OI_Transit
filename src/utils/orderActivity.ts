import type { Order } from '../types'

function changedLabel(label: string, before: string, after: string) {
  return `${label}: ${before || 'empty'} -> ${after || 'empty'}`
}

export function describeOrderChanges(previousOrder: Order | null, order: Order) {
  if (!previousOrder) {
    return `Created order ${order.id} for ${order.client}`
  }

  const changes: string[] = []

  if (previousOrder.deadline !== order.deadline) {
    changes.push(changedLabel('Deadline', previousOrder.deadline, order.deadline))
  }

  if (previousOrder.priority !== order.priority) {
    changes.push(changedLabel('Priority', previousOrder.priority, order.priority))
  }

  for (const task of order.tasks) {
    const previousTask = previousOrder.tasks.find((candidate) => candidate.dept === task.dept)

    if (!previousTask) {
      changes.push(`${task.dept} task added`)
      continue
    }

    if (previousTask.status !== task.status) {
      changes.push(changedLabel(`${task.dept} status`, previousTask.status, task.status))
    }

    if (previousTask.assignee !== task.assignee) {
      changes.push(changedLabel(`${task.dept} assignee`, previousTask.assignee, task.assignee))
    }

    if (previousTask.remark !== task.remark) {
      changes.push(`${task.dept} progress remark updated`)
    }

    if (
      previousTask.nextDeptRemark !== task.nextDeptRemark ||
      previousTask.nextDeptRemarkTarget !== task.nextDeptRemarkTarget
    ) {
      changes.push(`${task.dept} next-department remark updated`)
    }

    if (previousTask.holdReason !== task.holdReason) {
      changes.push(`${task.dept} hold reason updated`)
    }
  }

  return changes.length > 0 ? changes.join('; ') : 'Saved order without field changes'
}
