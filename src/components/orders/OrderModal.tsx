import { useEffect, useRef, useState } from 'react'
import {
  DEPARTMENTS,
  STATUS_META,
  themedDisabledStyle,
  themedInputStyle,
} from '../../data/constants'
import { Field } from '../common/Field'
import { StatusDot } from '../common/OrderVisuals'
import { OrderActivityTimeline } from './OrderActivityTimeline'
import type { Department, Order, Status, Task, Theme, User } from '../../types'
import { normalizeTask } from '../../utils/orders'
import {
  canDeleteOrders,
  updateTaskStatusAndAdvance,
  validateOrderTasks,
} from '../../utils/orderActions'

function DeleteOrderConfirmation({
  error,
  isDeleting,
  onCancel,
  onConfirm,
  order,
  theme,
}: {
  error: string
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
  order: Order
  theme: Theme
}) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const cancelButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    cancelButtonRef.current?.focus()
  }, [])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && !isDeleting) {
      event.preventDefault()
      onCancel()
      return
    }

    if (event.key !== 'Tab') {
      return
    }

    const buttons = Array.from(
      dialogRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
    )
    const firstButton = buttons[0]
    const lastButton = buttons.at(-1)

    if (event.shiftKey && document.activeElement === firstButton) {
      event.preventDefault()
      lastButton?.focus()
    } else if (!event.shiftKey && document.activeElement === lastButton) {
      event.preventDefault()
      firstButton?.focus()
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        background: 'rgba(15, 23, 42, 0.62)',
      }}
      onClick={(event) => {
        event.stopPropagation()

        if (event.target === event.currentTarget && !isDeleting) {
          onCancel()
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-order-title"
        aria-describedby="delete-order-description"
        onKeyDown={handleKeyDown}
        style={{
          width: '100%',
          maxWidth: 440,
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          background: theme.surface,
          boxShadow: '0 24px 64px rgba(15, 23, 42, 0.35)',
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            aria-hidden="true"
            style={{
              flex: '0 0 auto',
              width: 38,
              height: 38,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FEE2E2',
              color: '#B91C1C',
              fontSize: 20,
              fontWeight: 900,
            }}
          >
            !
          </div>
          <div>
            <h2
              id="delete-order-title"
              style={{ margin: 0, color: theme.text, fontSize: 19, lineHeight: 1.35 }}
            >
              Delete “{order.client}”?
            </h2>
            <p
              id="delete-order-description"
              style={{ margin: '8px 0 0', color: theme.textMuted, fontSize: 14, lineHeight: 1.55 }}
            >
              Order <strong>{order.id}</strong> and its complete activity history will be
              permanently removed. This action cannot be undone.
            </p>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 18,
              padding: '11px 13px',
              borderRadius: 8,
              border: '1px solid #FCA5A5',
              background: theme.inputBg === '#0B1220' ? '#2B151B' : '#FFF1F2',
              color: theme.inputBg === '#0B1220' ? '#FCA5A5' : '#B91C1C',
              fontSize: 13,
              fontWeight: 700,
              lineHeight: 1.45,
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            disabled={isDeleting}
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: '#A8F5E9',
              color: '#17324D',
              cursor: isDeleting ? 'not-allowed' : 'pointer',
              fontWeight: 700,
            }}
          >
            Keep Order
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            style={{
              minHeight: 44,
              padding: '10px 18px',
              borderRadius: 8,
              border: '1px solid #B91C1C',
              background: '#B91C1C',
              color: '#FFFFFF',
              cursor: isDeleting ? 'wait' : 'pointer',
              fontWeight: 800,
              opacity: isDeleting ? 0.75 : 1,
            }}
          >
            {isDeleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function OrderModal({
  order,
  onClose,
  onDelete,
  onSave,
  currentUser,
  theme,
}: {
  order: Order
  onClose: () => void
  onDelete: (id: string) => Promise<string | null>
  onSave: (id: string, updates: { tasks: Task[]; deadline: string }) => Promise<string | null>
  currentUser: User
  theme: Theme
}) {
  const normalizedTasks = order.tasks.map(normalizeTask)
  const currentTaskIndex = normalizedTasks.findIndex(
    (task) => task.status === 'In Progress' || task.status === 'On Hold',
  )
  const editableTaskIndex =
    currentUser.dept === 'Admin'
      ? currentTaskIndex >= 0
        ? currentTaskIndex
        : normalizedTasks.length - 1
      : normalizedTasks.findIndex((task) => task.dept === currentUser.dept)
  const initialActiveTab = editableTaskIndex >= 0 ? editableTaskIndex : 0

  const [tasks, setTasks] = useState<Task[]>(structuredClone(normalizedTasks))
  const [deadline, setDeadline] = useState(order.deadline)
  const [isChangingDeadline, setIsChangingDeadline] = useState(false)
  const [activeTab, setActiveTab] = useState(initialActiveTab)
  const [saveError, setSaveError] = useState('')
  const [deleteError, setDeleteError] = useState('')
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const update = <K extends keyof Task>(index: number, field: K, value: Task[K]) => {
    setSaveError('')
    setTasks((previous) => {
      const next = [...previous]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const updateStatus = (index: number, status: Status) => {
    setSaveError('')
    setTasks((previous) => {
      const result = updateTaskStatusAndAdvance(previous, index, status)

      if (currentUser.dept === 'Admin' && result.nextTaskIndex !== index) {
        setActiveTab(result.nextTaskIndex)
      }

      return result.tasks
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
                  onChange={(event) => updateStatus(activeTab, event.target.value as Status)}
                  disabled={!editable}
                  style={{ ...themedInputStyle(theme), ...(editable ? {} : themedDisabledStyle(theme)) }}
                >
                  {Object.keys(STATUS_META)
                    .filter((status) =>
                      activeTask.dept === 'Dispatch'
                        ? status !== 'Completed'
                        : status !== 'Dispatched',
                    )
                    .map((status) => (
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
                    background: editable
                      ? theme.inputBg === '#0B1220'
                        ? '#2B151B'
                        : '#FFF5F5'
                      : theme.surfaceAlt,
                    color:
                      editable && theme.inputBg === '#0B1220'
                        ? '#a8f5e9'
                        : theme.inputText,
                    resize: 'vertical',
                    ...(editable ? {} : { color: theme.textSoft, cursor: 'not-allowed' }),
                  }}
                />
              </Field>
            )}

            <OrderActivityTimeline orderId={order.id} theme={theme} />
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
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canDeleteOrders(currentUser) && (
              <button
                type="button"
                onClick={() => {
                  setDeleteError('')
                  setIsDeleteConfirmationOpen(true)
                }}
                disabled={isDeleting || isSaving}
                style={{
                  padding: '10px 16px',
                  borderRadius: 8,
                  border: '1px solid #DC2626',
                  background: theme.surface,
                  color: '#DC2626',
                  cursor: isDeleting || isSaving ? 'wait' : 'pointer',
                  fontWeight: 700,
                  opacity: isDeleting || isSaving ? 0.65 : 1,
                }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Order'}
              </button>
            )}
            <button
              onClick={onClose}
              disabled={isDeleting}
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
              onClick={async () => {
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
                setIsSaving(true)

                try {
                  const errorMessage = await onSave(order.id, { tasks, deadline })

                  if (errorMessage) {
                    setSaveError(errorMessage)
                  }
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isDeleting || isSaving}
              style={{
                padding: '10px 24px',
                borderRadius: 8,
                border: 'none',
                background: theme.primary,
                color: theme.primaryText,
                cursor: isDeleting || isSaving ? 'wait' : 'pointer',
                fontWeight: 700,
                opacity: isDeleting || isSaving ? 0.75 : 1,
              }}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      {isDeleteConfirmationOpen && (
        <DeleteOrderConfirmation
          error={deleteError}
          isDeleting={isDeleting}
          order={order}
          theme={theme}
          onCancel={() => setIsDeleteConfirmationOpen(false)}
          onConfirm={async () => {
            setDeleteError('')
            setIsDeleting(true)

            try {
              const errorMessage = await onDelete(order.id)

              if (errorMessage) {
                setDeleteError(errorMessage)
              }
            } finally {
              setIsDeleting(false)
            }
          }}
        />
      )}
    </div>
  )
}
