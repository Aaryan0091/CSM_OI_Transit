import { useState } from 'react'
import { DEPARTMENTS, themedInputStyle } from '../../data/constants'
import { Field } from '../common/Field'
import type { Company, Order, Priority, Theme } from '../../types'

export function AddOrderModal({
  onClose,
  onAdd,
  theme,
}: {
  onClose: () => void
  onAdd: (order: Order) => void
  theme: Theme
}) {
  const [form, setForm] = useState<{
    company: Company
    client: string
    product: string
    description: string
    deadline: string
    priority: Priority
  }>({
    company: 'CSM',
    client: '',
    product: '',
    description: '',
    deadline: '',
    priority: 'Medium',
  })

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((previous) => ({ ...previous, [key]: value }))
  }

  const handleAdd = () => {
    if (!form.client || !form.product || !form.deadline) {
      return
    }

    const newOrder: Order = {
      id: `ORD-${String(Math.floor(Math.random() * 900) + 100)}`,
      ...form,
      overallStatus: 'In Progress',
      tasks: DEPARTMENTS.map((dept) => ({
        dept,
        status: 'In Progress',
        assignee: '',
        remark: '',
        nextDeptRemark: '',
        nextDeptRemarkTarget: '',
        holdReason: '',
      })),
      createdAt: new Date().toISOString().split('T')[0],
    }

    onAdd(newOrder)
  }

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
          maxWidth: 480,
          boxShadow: theme.shadow,
          overflow: 'hidden',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: theme.text }}>New Order</div>
          <div style={{ fontSize: 12, color: theme.textSoft, marginTop: 2 }}>
            Fill details to add this order to the tracker
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="Company" theme={theme}>
            <select
              value={form.company}
              onChange={(event) => updateField('company', event.target.value as Company)}
              style={themedInputStyle(theme)}
            >
              {(['CSM', 'Oriental'] as const).map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>
          </Field>
          <Field label="Client / Organisation" theme={theme}>
            <input
              value={form.client}
              onChange={(event) => updateField('client', event.target.value)}
              placeholder="e.g. Indian Railways - NR Zone"
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Product" theme={theme}>
            <input
              value={form.product}
              onChange={(event) => updateField('product', event.target.value)}
              placeholder="e.g. FRP Cable Trays"
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Description" theme={theme}>
            <textarea
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="e.g. x 200 mtrs or extra order details"
              rows={3}
              style={{ ...themedInputStyle(theme), resize: 'vertical' }}
            />
          </Field>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <Field label="Deadline" theme={theme}>
              <input
                type="date"
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
                style={themedInputStyle(theme)}
              />
            </Field>
            <Field label="Priority" theme={theme}>
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value as Priority)}
                style={themedInputStyle(theme)}
              >
                {(['Low', 'Medium', 'High', 'Critical'] as const).map((priority) => (
                  <option key={priority}>{priority}</option>
                ))}
              </select>
            </Field>
          </div>
        </div>
        <div
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.border}`,
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
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
            onClick={handleAdd}
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
            Add Order
          </button>
        </div>
      </div>
    </div>
  )
}
