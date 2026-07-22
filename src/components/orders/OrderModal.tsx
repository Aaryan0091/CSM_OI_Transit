import { useState } from 'react'
import {
  DEPARTMENTS,
  STATUS_META,
  themedDisabledStyle,
  themedInputStyle,
} from '../../data/constants'
import { Field } from '../common/Field'
import { StatusDot } from '../common/OrderVisuals'
import type { Department, Order, Status, Task, Theme, User } from '../../types'
import { normalizeTask } from '../../utils/orders'
import { validateOrderTasks } from '../../utils/orderActions'

export function OrderModal({
  order,
  onClose,
  onSave,
  currentUser,
  theme,
}: {
  order: Order
  onClose: () => void
  onSave: (id: string, updates: { tasks: Task[]; deadline: string }) => void
  currentUser: User
  theme: Theme
}) {
  const normalizedTasks = order.tasks.map(normalizeTask)
  const editableTaskIndex =
    currentUser.dept === 'Admin'
      ? 0
      : normalizedTasks.findIndex((task) => task.dept === currentUser.dept)
  const initialActiveTab = editableTaskIndex >= 0 ? editableTaskIndex : 0

  const [tasks, setTasks] = useState<Task[]>(structuredClone(normalizedTasks))
  const [deadline, setDeadline] = useState(order.deadline)
  const [isChangingDeadline, setIsChangingDeadline] = useState(false)
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [saveError, setSaveError] = useState('')

  const update = <K extends keyof Task>(index: number, field: K, value: Task[K]) => {
    setSaveError('')
    setTasks((previous) => {
      const next = [...previous]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const canEdit = (dept: Department) => currentUser.dept === 'Admin' || currentUser.dept === dept
  const adminEditable = currentUser.dept === 'Admin'
  const visibleTasks = adminEditable
    ? tasks.map((task, index) => ({ task, index }))
    : tasks
        .map((task, index) => ({ task, index }))
        .filter(({ task }) => task.dept === currentUser.dept)
  const activeTask = tasks[activeTab]
  const editable = canEdit(activeTask.dept)
  const availableRemarkTargets = DEPARTMENTS.slice(activeTab + 1)
  const previousDeptRemarks = tasks
    .slice(0, activeTab)
    .filter(
      (task) =>
        (task.status === 'Completed' || task.status === 'Dispatched') &&
        task.nextDeptRemark.trim() &&
        (task.nextDeptRemarkTarget === '' || task.nextDeptRemarkTarget === activeTask.dept),
    )

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: theme.overlay,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.surface,
          borderRadius: 16,
          width: '100%',
          maxWidth: 740,
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: theme.shadow,
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, color: theme.textSoft, fontWeight: 700, letterSpacing: '0.08em', marginBottom: 4 }}>
                {order.id}
              </div>
              <div style={{ fontSize: 11, color: theme.primary, fontWeight: 700, marginBottom: 6 }}>
                {order.company}
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: theme.text }}>{order.client}</div>
              <div style={{ fontSize: 13, color: theme.textMuted, marginTop: 2 }}>{order.product}</div>
              {order.description && (
                <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 4 }}>
                  {order.description}
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                background: theme.surfaceAlt,
                border: 'none',
                borderRadius: 8,
                width: 32,
                height: 32,
                cursor: 'pointer',
                fontSize: 18,
                color: theme.textMuted,
              }}
            >
              x
            </button>
          </div>

          <div style={{ display: 'flex', gap: 4, marginTop: 16, flexWrap: 'wrap' }}>
            {visibleTasks.map(({ task, index }) => (
              <button
                key={task.dept}
                onClick={() => setActiveTab(index)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: 12,
                  background: activeTab === index ? theme.primary : theme.surfaceAlt,
                  color: activeTab === index ? theme.primaryText : theme.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <StatusDot status={task.status} />
                {task.dept}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {saveError && (
              <div
                role="alert"
                style={{
                  background: '#FEE2E2',
                  borderRadius: 8,
                  padding: '10px 12px',
                  fontSize: 12,
                  color: '#B91C1C',
                  fontWeight: 700,
                }}
              >
                {saveError}
              </div>
            )}
            {!editable && (
              <div
                style={{
                  background: theme.surfaceAlt,
                  borderRadius: 8,
                  padding: '8px 12px',
                  fontSize: 12,
                  color: theme.textMuted,
                  fontWeight: 600,
                }}
              >
                View only. Only {activeTask.dept} or Admin can edit this department&apos;s tasks.
              </div>
            )}

            {previousDeptRemarks.length > 0 && (
              <div
                style={{
                  background: theme.surfaceAlt,
                  border: '1px solid #a8f5e9',
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    color: '#0F766E',
                    marginBottom: 10,
                  }}
                >
                  REMARKS FOR THIS DEPARTMENT
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {previousDeptRemarks.map((task) => (
                    <div
                      key={task.dept}
                      style={{
                        background: theme.surface,
                        borderRadius: 10,
                        padding: '10px 12px',
                        borderLeft: '4px solid #0F766E',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: theme.text }}>
                        {task.dept} remark for {task.nextDeptRemarkTarget || 'later departments'}
                      </div>
                      <div style={{ fontSize: 12, color: theme.textMuted, marginTop: 4, lineHeight: 1.5 }}>
                        {task.nextDeptRemark}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 12,
              }}
            >
              <Field label="Deadline" theme={theme}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div
                    style={{
                      ...themedInputStyle(theme),
                      display: 'flex',
                      alignItems: 'center',
                      minHeight: 38,
                    }}
                  >
                    {deadline}
                  </div>
                  {adminEditable && (
                    <button
                      type="button"
                      onClick={() => setIsChangingDeadline((previous) => !previous)}
                      style={{
                        alignSelf: 'flex-start',
                        padding: '8px 12px',
                        borderRadius: 8,
                        border: `1px solid ${theme.border}`,
                        background: theme.surfaceAlt,
                        color: theme.textMuted,
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: 12,
                      }}
                    >
                      {isChangingDeadline ? 'Cancel Deadline Change' : 'Change Deadline'}
                    </button>
                  )}
                  {adminEditable && isChangingDeadline && (
                    <input
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      style={themedInputStyle(theme)}
                    />
                  )}
                </div>
              </Field>
              <Field label="Assignee" theme={theme}>
                <input
                  value={activeTask.assignee}
                  onChange={(event) => update(activeTab, 'assignee', event.target.value)}
                  placeholder="Who is working on this?"
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                />
              </Field>
              <Field label="Status" theme={theme}>
                <select
                  value={activeTask.status}
                  onChange={(event) => update(activeTab, 'status', event.target.value as Status)}
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                >
                  {Object.keys(STATUS_META).map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Remarks / Progress Update" theme={theme}>
              <textarea
                value={activeTask.remark}
                onChange={(event) => update(activeTab, 'remark', event.target.value)}
                placeholder="What's the current update from this department?"
                disabled={!editable}
                rows={3}
                style={{ ...themedInputStyle(theme), resize: 'vertical', ...(editable ? {} : themedDisabledStyle(theme)) }}
              />
            </Field>

            <Field label="Remark For Next Departments" theme={theme}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <select
                  value={activeTask.nextDeptRemarkTarget}
                  onChange={(event) =>
                    update(activeTab, 'nextDeptRemarkTarget', event.target.value as Department | '')
                  }
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                >
                  <option value="">All later departments</option>
                  {availableRemarkTargets.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
                <textarea
                  value={activeTask.nextDeptRemark}
                  onChange={(event) => update(activeTab, 'nextDeptRemark', event.target.value)}
                  placeholder="What should the selected department know before they continue?"
                  disabled={!editable}
                  rows={3}
                  style={{
                    ...themedInputStyle(theme),
                    resize: 'vertical',
                    background: theme.surfaceAlt,
                    borderColor: '#a8f5e9',
                    ...(editable ? {} : { color: theme.textSoft, cursor: 'not-allowed' }),
                  }}
                />
              </div>
            </Field>

            {activeTask.status === 'On Hold' && (
              <Field label="Hold Reason" accent theme={theme}>
                <textarea
                  value={activeTask.holdReason}
                  onChange={(event) => update(activeTab, 'holdReason', event.target.value)}
                  placeholder="Why is this on hold? Who or what is blocking progress?"
                  disabled={!editable}
                  rows={3}
                  style={{
                    ...themedInputStyle(theme),
                    borderColor: '#FCA5A5',
                    background: editable ? '#FFF5F5' : theme.surfaceAlt,
                    resize: 'vertical',
                    ...(editable ? {} : { color: theme.textSoft, cursor: 'not-allowed' }),
                  }}
                />
              </Field>
            )}
          </div>
        </div>

        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11, color: theme.textSoft }}>
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.dept})
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: theme.surface,
                cursor: 'pointer',
                fontWeight: 600,
                color: theme.textMuted,
              }}
            >
              Cancel
            </button>
            <button
              onClick={() => {
                const taskValidationError = validateOrderTasks(tasks)

                if (taskValidationError) {
                  setSaveError(taskValidationError)
                  return
                }

                if (currentUser.dept === 'Admin' && !deadline.trim()) {
                  setSaveError('Please choose a deadline before saving this order.')
                  return
                }

                setSaveError('')
                onSave(order.id, { tasks, deadline })
              }}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: theme.primary,
                color: theme.primaryText,
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
