import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { THEMES } from '../../data/constants'
import type { User } from '../../types'
import { AppHeader } from './AppHeader'

const theme = THEMES.light

function renderHeader(user: User, overrides?: Partial<Parameters<typeof AppHeader>[0]>) {
  const props = {
    currentUser: user,
    theme,
    themeMode: 'light' as const,
    onToggleTheme: vi.fn(),
    onOpenNewOrder: vi.fn(),
    onSignOut: vi.fn(),
    ...overrides,
  }

  render(<AppHeader {...props} />)
  return props
}

describe('AppHeader admin gating', () => {
  it('shows the new order action only for admins', () => {
    renderHeader({
      uid: '1',
      email: 'admin@company.com',
      emailVerified: true,
      name: 'Admin',
      dept: 'Admin',
    })

    expect(screen.queryByText('+ New Order')).not.toBeNull()
    expect(screen.queryByText('Admin access: contact owner')).toBeNull()
  })

  it('tells non-admin users to contact the owner for admin access', () => {
    renderHeader({
      uid: '2',
      email: 'design@company.com',
      emailVerified: true,
      name: 'Design',
      dept: 'Design',
    })

    expect(screen.queryByText('+ New Order')).toBeNull()
    expect(screen.queryByText('Admin access: contact owner')).not.toBeNull()
  })
})
