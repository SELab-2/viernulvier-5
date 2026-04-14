import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

vi.mock('../../components/admin/AdminMessagesContext', () => ({
  useAdminMessages: () => ({
    auth: {
      dashboardTitle: 'Admin dashboard',
      dashboardDescription: 'Manage the VIERNULVIER archive from one central workspace.',
    },
  }),
}))

describe('DashboardPage', () => {
  it('renders the localized dashboard copy', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Admin dashboard')).toBeInTheDocument()
    expect(screen.getByText('Manage the VIERNULVIER archive from one central workspace.')).toBeInTheDocument()
  })
})
