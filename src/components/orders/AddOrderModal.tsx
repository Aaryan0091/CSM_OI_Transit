import { useState } from 'react'
import { themedInputStyle } from '../../data/constants'
import { Field } from '../common/Field'
import type { Company, Order, Priority, Theme } from '../../types'
import { buildNewOrder, ORDER_INPUT_LIMITS } from '../../utils/orderActions'

type AddOrderForm = {
  orderNumber: string
  company: Company
  client: string
  product: string
  description: string
  deadline: string
  priority: Priority
}

const EMPTY_ORDER_FORM: AddOrderForm = {
  orderNumber: '',
  company: 'CSM',
  client: '',
  product: '',
  description: '',
  deadline: '',
  priority: 'Medium',
}

function draftStorageKey(ownerId: string) {
  return `csm-order-draft:v1:${ownerId}`
}

function isAddOrderForm(value: unknown): value is AddOrderForm {
  if (!value || typeof value !== 'object') {
    return false
  }

  const draft = value as Partial<AddOrderForm>
  return (
    typeof draft.orderNumber === 'string' &&
    (draft.company === 'CSM' || draft.company === 'Oriental') &&
    typeof draft.client === 'string' &&
    typeof draft.product === 'string' &&
    typeof draft.description === 'string' &&
    typeof draft.deadline === 'string' &&
    ['Low', 'Medium', 'High', 'Critical'].includes(draft.priority ?? '')
  )
}

function loadDraft(ownerId: string): AddOrderForm {
  try {
    const savedDraft = window.sessionStorage.getItem(draftStorageKey(ownerId))

    if (!savedDraft) {
      return EMPTY_ORDER_FORM
    }

    const parsedDraft: unknown = JSON.parse(savedDraft)
    return isAddOrderForm(parsedDraft) ? parsedDraft : EMPTY_ORDER_FORM
  } catch {
    return EMPTY_ORDER_FORM
  }
}

function saveDraft(ownerId: string, draft: AddOrderForm) {
  try {
    window.sessionStorage.setItem(draftStorageKey(ownerId), JSON.stringify(draft))
  } catch {
    // The form still works when storage is unavailable in a private browser context.
  }
}

function clearDraft(ownerId: string) {
  try {
    window.sessionStorage.removeItem(draftStorageKey(ownerId))
  } catch {
    // Nothing else is required when storage is unavailable.
  }
}

export function AddOrderModal({
  onClose,
  onAdd,
  draftOwnerId,
  theme,
}: {
  onClose: () => void
  onAdd: (order: Order) => Promise<string | null>
  draftOwnerId: string
  theme: Theme
}) {
  const [form, setForm] = useState<AddOrderForm>(() => loadDraft(draftOwnerId))
  const [formError, setFormError] = useState('')
  const [isAdding, setIsAdding] = useState(false)

  const updateField = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setFormError('')
    setForm((previous) => {
      const nextForm = { ...previous, [key]: value }
      saveDraft(draftOwnerId, nextForm)
      return nextForm
    })
  }

  const handleCancel = () => {
    clearDraft(draftOwnerId)
    onClose()
  }

  const handleAdd = async () => {
    const nextOrder = buildNewOrder(form)

    if (!nextOrder.order || nextOrder.error) {
      setFormError(nextOrder.error ?? 'Unable to create this order right now.')
      return
    }

    setIsAdding(true)

    try {
      const errorMessage = await onAdd(nextOrder.order as Order)

      if (errorMessage) {
        setFormError(errorMessage)
      } else {
        clearDraft(draftOwnerId)
        onClose()
      }
    } finally {
      setIsAdding(false)
    }
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
            Enter the business order number; a permanent system ID is assigned automatically
          </div>
        </div>
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {formError && (
            <div
              role="alert"
              style={{
                borderRadius: 10,
                background: '#FEE2E2',
                color: '#B91C1C',
                padding: '10px 12px',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {formError}
            </div>
          )}
          <Field label="Order Number" htmlFor="new-order-number" theme={theme}>
            <input
              id="new-order-number"
              value={form.orderNumber}
              onChange={(event) => updateField('orderNumber', event.target.value)}
              placeholder="Enter the order number"
              maxLength={ORDER_INPUT_LIMITS.orderNumber}
              autoFocus
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Company" htmlFor="new-order-company" theme={theme}>
            <select
              id="new-order-company"
              value={form.company}
              onChange={(event) => updateField('company', event.target.value as Company)}
              style={themedInputStyle(theme)}
            >
              {(['CSM', 'Oriental'] as const).map((company) => (
                <option key={company}>{company}</option>
              ))}
            </select>
          </Field>
          <Field label="Client / Organisation" htmlFor="new-order-client" theme={theme}>
            <input
              id="new-order-client"
              value={form.client}
              onChange={(event) => updateField('client', event.target.value)}
              placeholder="Enter client or organisation name"
              maxLength={ORDER_INPUT_LIMITS.client}
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Product" htmlFor="new-order-product" theme={theme}>
            <input
              id="new-order-product"
              value={form.product}
              onChange={(event) => updateField('product', event.target.value)}
              placeholder="e.g. FRP Cable Trays"
              maxLength={ORDER_INPUT_LIMITS.product}
              style={themedInputStyle(theme)}
            />
          </Field>
          <Field label="Description" htmlFor="new-order-description" theme={theme}>
            <textarea
              id="new-order-description"
              value={form.description}
              onChange={(event) => updateField('description', event.target.value)}
              placeholder="e.g. x 200 mtrs or extra order details"
              maxLength={ORDER_INPUT_LIMITS.description}
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
            <Field label="Deadline" htmlFor="new-order-deadline" theme={theme}>
              <input
                id="new-order-deadline"
                type="date"
                value={form.deadline}
                onChange={(event) => updateField('deadline', event.target.value)}
                style={themedInputStyle(theme)}
              />
            </Field>
            <Field label="Priority" htmlFor="new-order-priority" theme={theme}>
              <select
                id="new-order-priority"
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
            onClick={handleCancel}
            disabled={isAdding}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: theme.surface,
              cursor: isAdding ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: theme.textMuted,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isAdding}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              border: 'none',
              background: theme.primary,
              color: theme.primaryText,
              cursor: isAdding ? 'wait' : 'pointer',
              fontWeight: 700,
              opacity: isAdding ? 0.75 : 1,
            }}
          >
            {isAdding ? 'Assigning Number...' : 'Add Order'}
          </button>
        </div>
      </div>
    </div>
  )
}
