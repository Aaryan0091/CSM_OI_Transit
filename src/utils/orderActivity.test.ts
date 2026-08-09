import { describe, expect, it } from 'vitest'
import type { Order } from '../types'
import { describeOrderChanges } from './orderActivity'

const order: Order = {
  id: 'ORD-100',
  company: 'CSM',
  client: 'Test Client',
  product: 'Test Product',
  description: '',
  deadline: '2026-09-01',
  priority: 'Medium',
  overallStatus: 'In Progress',
  tasks: ['Sales', 'Design', 'Procurement', 'Production', 'QC', 'Dispatch'].map((dept) => ({
    dept: dept as Order['tasks'][number]['dept'],
    status: 'In Progress',
    assignee: '',
    remark: '',
    nextDeptRemark: '',
    nextDeptRemarkTarget: '',
    holdReason: '',
  })),
  createdAt: '2026-08-09',
}

describe('describeOrderChanges', () => {
  it('describes new orders', () => {
    expect(describeOrderChanges(null, order)).toBe(
      'Created order ORD-100 for Test Client',
    )
  })

  it('describes changed deadlines and department fields', () => {
    const updated = structuredClone(order)
    updated.deadline = '2026-09-15'
    updated.tasks[0].status = 'Completed'
    updated.tasks[0].remark = 'Sales complete'

    expect(describeOrderChanges(order, updated)).toBe(
      'Deadline: 2026-09-01 -> 2026-09-15; Sales status: In Progress -> Completed; Sales progress remark updated',
    )
  })
})
