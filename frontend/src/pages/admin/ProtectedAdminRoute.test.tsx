import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import ProtectedAdminRoute from './ProtectedAdminRoute'

const useAdminSessionMock = vi.hoisted(() => vi.fn())

vi.mock('../../auth/useAdminSession', () => ({
  useAdminSession: useAdminSessionMock,
}))

function LoginPageProbe() {
  const location = useLocation()
  const fromPath = (location.state as { from?: string } | null)?.from ?? 'missing'

  return <div>Login page from {fromPath}</div>
}

describe('ProtectedAdminRoute', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing while session status is loading', () => {
    useAdminSessionMock.mockReturnValue({ isLoading: true, isAuthenticated: false })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <ProtectedAdminRoute loginPath="/admin/login">
          <div>Secret</div>
        </ProtectedAdminRoute>
      </MemoryRouter>,
    )

    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('redirects unauthenticated users to the login page with the requested location', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })

    render(
      <MemoryRouter initialEntries={['/admin/archive/42/edit?tab=metadata#notes']}>
        <Routes>
          <Route
            path="/admin/archive/:id/edit"
            element={
              <ProtectedAdminRoute loginPath="/admin/login">
                <div>Secret</div>
              </ProtectedAdminRoute>
            }
          />
          <Route path="/admin/login" element={<LoginPageProbe />} />
        </Routes>
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from /admin/archive/42/edit?tab=metadata#notes')).toBeInTheDocument()
    })

    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('renders children for authenticated users', () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: true })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <ProtectedAdminRoute loginPath="/admin/login">
          <div>Secret</div>
        </ProtectedAdminRoute>
      </MemoryRouter>,
    )

    expect(screen.getByText('Secret')).toBeInTheDocument()
  })
})
