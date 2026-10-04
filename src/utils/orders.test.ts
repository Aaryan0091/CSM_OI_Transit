import { describe, expect, it } from 'vitest'
import type { Order, Status, Task } from '../types'
import {
  formatDate,
  formatDateTime,
  normalizeOrder,
  normalizeTask,
  pipelineProgressPct,
  sortOrders,
} from './orders'

const departments = ['Sales', 'Design', 'Procurement', 'Production', 'QC', 'Dispatch'] as const

function buildTasks(statuses: Status[]): Task[] {
  return departments.map((dept, index) => ({
    dept,
    status: statuses[index],
    assignee: '',
    remark: '',
    nextDeptRemark: '',
    nextDeptRemarkTarget: '',
    holdReason: '',
  }))
}

describe('pipelineProgressPct', () => {
  it('tracks the active department position', () => {
    expect(
      pipelineProgressPct(
        buildTasks([
          'Completed',
          'In Progress',
          'Pending',
          'Pending',
          'Pending',
          'Pending',
        ]),
      ),
    ).toBe(20)
  })

  it('tracks a department that is on hold', () => {
    expect(
      pipelineProgressPct(
        buildTasks([
          'Completed',
          'Completed',
          'On Hold',
          'Pending',
          'Pending',
          'Pending',
        ]),
      ),
    ).toBe(40)
  })

  it('stops at the end after dispatch', () => {
    expect(
      pipelineProgressPct(
        buildTasks([
          'Completed',
          'Completed',
          'Completed',
          'Completed',
          'Completed',
          'Dispatched',
        ]),
      ),
    ).toBe(100)
  })
})

describe('normalizeTask', () => {
  it('adds fields required by current rules to legacy tasks', () => {
    const normalized = normalizeTask({
      dept: 'Sales',
      status: 'In Progress',
      assignee: '',
      remark: '',
    })

    expect(normalized.holdReason).toBe('')
    expect(normalized.nextDeptRemark).toBe('')
    expect(normalized.nextDeptRemarkTarget).toBe('')
  })

  it('removes legacy task fields rejected by current rules', () => {
    const normalized = normalizeTask({
      dept: 'Sales',
      status: 'In Progress',
      assignee: '',
      remark: '',
      legacyOwner: 'old value',
    } as Parameters<typeof normalizeTask>[0])

    expect(normalized).not.toHaveProperty('legacyOwner')
  })
})

describe('normalizeOrder', () => {
  it('writes only the current Firestore order schema', () => {
    const order = {
      id: 'ORD-166',
      company: 'CSM',
      client: 'GG developers',
      product: 'Trays',
      description: '200 mtrs',
      deadline: '2026-08-12',
      priority: 'Medium',
      overallStatus: 'In Progress',
      tasks: buildTasks([
        'In Progress',
        'In Progress',
        'In Progress',
        'In Progress',
        'In Progress',
        'In Progress',
      ]),
      createdAt: '2026-08-09',
      legacyProgress: 10,
    } as Order

    expect(normalizeOrder(order)).not.toHaveProperty('legacyProgress')
  })
})

describe('date formatting', () => {
  it('shows stored yyyy-mm-dd dates as dd-mm-yyyy', () => {
    expect(formatDate('2026-08-12')).toBe('12-08-2026')
  })

  it('reformats dates inside activity summaries', () => {
    expect(formatDate('Deadline: 2026-09-01 -> 2026-09-15; Sales status: In Progress -> Completed')).toBe(
      'Deadline: 01-09-2026 -> 15-09-2026; Sales status: In Progress -> Completed',
    )
  })

  it('formats timestamps as dd-mm-yyyy, HH:MM in local time', () => {
    expect(formatDateTime(new Date(2026, 9, 4, 9, 5).toISOString())).toBe('04-10-2026, 09:05')
  })
})

describe('sortOrders', () => {
  const orders = [
    { id: 'ORD-1001', deadline: '2026-11-20', createdAt: '2026-10-01' },
    { id: 'ORD-1002', deadline: '2026-10-10', createdAt: '2026-10-02' },
    { id: 'ORD-1003', deadline: '2026-12-05', createdAt: '2026-10-03' },
  ] as Order[]
  const ids = (sorted: Order[]) => sorted.map((order) => order.id)

  it('puts the nearest deadline first', () => {
    expect(ids(sortOrders(orders, 'deadline-asc'))).toEqual(['ORD-1002', 'ORD-1001', 'ORD-1003'])
  })

  it('puts the farthest deadline first', () => {
    expect(ids(sortOrders(orders, 'deadline-desc'))).toEqual(['ORD-1003', 'ORD-1001', 'ORD-1002'])
  })

  it('puts the newest orders first', () => {
    expect(ids(sortOrders(orders, 'newest'))).toEqual(['ORD-1003', 'ORD-1002', 'ORD-1001'])
  })

  it('does not mutate the original list', () => {
    sortOrders(orders, 'deadline-asc')
    expect(ids(orders)).toEqual(['ORD-1001', 'ORD-1002', 'ORD-1003'])
  })
})
