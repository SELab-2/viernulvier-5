import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DashboardPage from './DashboardPage'

vi.mock('../../components/admin/AdminLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

describe('DashboardPage', () => {
  it('renders the dashboard title', () => {
    render(<DashboardPage />)

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument()
  })
})
