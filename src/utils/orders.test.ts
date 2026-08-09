import { describe, expect, it } from 'vitest'
import type { Status, Task } from '../types'
import { pipelineProgressPct } from './orders'

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
