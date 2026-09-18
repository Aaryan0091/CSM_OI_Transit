import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { THEMES } from '../../data/constants'
import type { Order } from '../../types'
import { AddOrderModal } from './AddOrderModal'

describe('AddOrderModal order numbers', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('requires an order number before creating an order', async () => {
    const onAdd = vi.fn(async (order: Order): Promise<string | null> => {
      void order
      return null
    })
    render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
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
        draftOwnerId="sales-user"
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

  it('shows the description limit before calling Firestore', async () => {
    const onAdd = vi.fn(async (): Promise<string | null> => null)
    render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'WO-5001' },
    })
    fireEvent.change(screen.getByLabelText('CLIENT / ORGANISATION'), {
      target: { value: 'Test Client' },
    })
    fireEvent.change(screen.getByLabelText('PRODUCT'), {
      target: { value: 'Test Product' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION'), {
      target: { value: 'D'.repeat(5001) },
    })
    fireEvent.change(screen.getByLabelText('DEADLINE'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Order' }))

    expect((await screen.findByRole('alert')).textContent).toContain(
      'The description must be 5,000 characters or fewer.',
    )
    expect(onAdd).not.toHaveBeenCalled()
  })

  it('restores a draft after the modal is unmounted and reopened', () => {
    const onAdd = vi.fn(async (): Promise<string | null> => null)
    const firstRender = render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'PO 500' },
    })
    fireEvent.change(screen.getByLabelText('COMPANY'), {
      target: { value: 'Oriental' },
    })
    fireEvent.change(screen.getByLabelText('CLIENT / ORGANISATION'), {
      target: { value: 'Railway Client' },
    })
    fireEvent.change(screen.getByLabelText('PRODUCT'), {
      target: { value: 'Attachment Wall' },
    })
    fireEvent.change(screen.getByLabelText('DESCRIPTION'), {
      target: { value: 'Copied PO details' },
    })
    fireEvent.change(screen.getByLabelText('DEADLINE'), {
      target: { value: '2026-11-15' },
    })
    fireEvent.change(screen.getByLabelText('PRIORITY'), {
      target: { value: 'High' },
    })
    firstRender.unmount()

    render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    expect((screen.getByLabelText('ORDER NUMBER') as HTMLInputElement).value).toBe('PO 500')
    expect((screen.getByLabelText('COMPANY') as HTMLSelectElement).value).toBe('Oriental')
    expect((screen.getByLabelText('CLIENT / ORGANISATION') as HTMLInputElement).value).toBe(
      'Railway Client',
    )
    expect((screen.getByLabelText('PRODUCT') as HTMLInputElement).value).toBe(
      'Attachment Wall',
    )
    expect((screen.getByLabelText('DESCRIPTION') as HTMLTextAreaElement).value).toBe(
      'Copied PO details',
    )
    expect((screen.getByLabelText('DEADLINE') as HTMLInputElement).value).toBe('2026-11-15')
    expect((screen.getByLabelText('PRIORITY') as HTMLSelectElement).value).toBe('High')
  })

  it('does not expose one user’s draft to another user', () => {
    const firstRender = render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={vi.fn()}
        draftOwnerId="first-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'PRIVATE-PO' },
    })
    firstRender.unmount()

    render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={vi.fn()}
        draftOwnerId="second-user"
        theme={THEMES.light}
      />,
    )

    expect((screen.getByLabelText('ORDER NUMBER') as HTMLInputElement).value).toBe('')
  })

  it('clears the saved draft when Cancel is explicitly selected', () => {
    const onClose = vi.fn()
    const firstRender = render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={onClose}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'DISCARD-ME' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onClose).toHaveBeenCalledTimes(1)
    firstRender.unmount()

    render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    expect((screen.getByLabelText('ORDER NUMBER') as HTMLInputElement).value).toBe('')
  })

  it('clears the saved draft after the order is created successfully', async () => {
    const onAdd = vi.fn(async (): Promise<string | null> => null)
    const onClose = vi.fn()
    const firstRender = render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={onClose}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'CREATED-PO' },
    })
    fireEvent.change(screen.getByLabelText('CLIENT / ORGANISATION'), {
      target: { value: 'Test Client' },
    })
    fireEvent.change(screen.getByLabelText('PRODUCT'), {
      target: { value: 'Test Product' },
    })
    fireEvent.change(screen.getByLabelText('DEADLINE'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Order' }))
    await waitFor(() => expect(onAdd).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
    firstRender.unmount()

    render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    expect((screen.getByLabelText('ORDER NUMBER') as HTMLInputElement).value).toBe('')
  })

  it('keeps the draft open and recoverable when Firestore rejects the save', async () => {
    const onAdd = vi.fn(async (): Promise<string | null> => 'Temporary save failure')
    const onClose = vi.fn()
    const firstRender = render(
      <AddOrderModal
        onAdd={onAdd}
        onClose={onClose}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    fireEvent.change(screen.getByLabelText('ORDER NUMBER'), {
      target: { value: 'RETRY-PO' },
    })
    fireEvent.change(screen.getByLabelText('CLIENT / ORGANISATION'), {
      target: { value: 'Test Client' },
    })
    fireEvent.change(screen.getByLabelText('PRODUCT'), {
      target: { value: 'Test Product' },
    })
    fireEvent.change(screen.getByLabelText('DEADLINE'), {
      target: { value: '2026-10-01' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Add Order' }))

    expect((await screen.findByRole('alert')).textContent).toContain('Temporary save failure')
    expect(onClose).not.toHaveBeenCalled()
    firstRender.unmount()

    render(
      <AddOrderModal
        onAdd={vi.fn(async (): Promise<string | null> => null)}
        onClose={vi.fn()}
        draftOwnerId="sales-user"
        theme={THEMES.light}
      />,
    )

    expect((screen.getByLabelText('ORDER NUMBER') as HTMLInputElement).value).toBe('RETRY-PO')
  })
})
