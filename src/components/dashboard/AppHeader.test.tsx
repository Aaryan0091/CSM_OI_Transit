import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEMES } from '../../data/constants'
import type { User } from '../../types'
import { AppHeader } from './AppHeader'

function user(dept: User['dept']): User {
  return {
    uid: `${dept.toLowerCase()}-user`,
    email: `${dept.toLowerCase()}@company.com`,
    emailVerified: true,
    name: `${dept} User`,
    dept,
  }
}

function renderHeader(currentUser: User, onOpenNewOrder = vi.fn()) {
  render(
    <AppHeader
      currentUser={currentUser}
      onOpenNewOrder={onOpenNewOrder}
      onSignOut={vi.fn()}
      onToggleTheme={vi.fn()}
      theme={THEMES.light}
      themeMode="light"
    />,
  )

  return onOpenNewOrder
}

describe('AppHeader order creation access', () => {
  it.each(['Admin', 'Sales'] as const)(
    'shows the New Order button to %s users',
    (department) => {
      const onOpenNewOrder = renderHeader(user(department))

      fireEvent.click(screen.getByRole('button', { name: '+ New Order' }))

      expect(onOpenNewOrder).toHaveBeenCalledOnce()
      expect(screen.queryByText('Admin access: contact owner')).toBeNull()
    },
  )

  it('hides the New Order button from other departments', () => {
    renderHeader(user('Design'))

    expect(screen.queryByRole('button', { name: '+ New Order' })).toBeNull()
    expect(screen.queryByText('Admin access: contact owner')).not.toBeNull()
  })
})
