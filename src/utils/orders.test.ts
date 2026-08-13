import { describe, expect, it } from 'vitest'
import type { Order, Status, Task } from '../types'
import { normalizeOrder, normalizeTask, pipelineProgressPct } from './orders'

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
