import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEMES } from '../../data/constants'
import type { Order } from '../../types'
import { AddOrderModal } from './AddOrderModal'

describe('AddOrderModal order numbers', () => {
  it('requires an order number before creating an order', async () => {
    const onAdd = vi.fn(async (order: Order): Promise<string | null> => {
      void order
      return null
    })
    render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        theme={THEMES.light}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Add Order' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'Please enter the order number.',
    )
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('passes the entered order number into the save flow', async () => {
    const onAdd = vi.fn(async (order: Order): Promise<string | null> => {
      void order
      return null
    })
    render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'Client-WO/42' },
    })
    fireEvent.change(screen.getByLabelText('CLIENT / ORGANISATION'), {
      target: { value: 'Test Client' },
    })
    fireEvent.change(screen.getByLabelText('PRODUCT'), {
      target: { value: 'Cable Tray' },
    })
    fireEvent.change(screen.getByLabelText('DEADLINE'), {
      target: { value: '2026-09-30' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Order' }))

    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1))
    const savedDraft = onAdd.mock.calls[0][0]
    expect(savedDraft.orderNumber).toBe('Client-WO/42')
    expect(savedDraft.orderNumberKey).toBe('CLIENT-WO%2F42')
  })
})
