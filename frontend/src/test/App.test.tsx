import { describe, it, expect, vi } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

const getAdminRouteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('../admin/paths', async () => {
  const actual = await vi.importActual<typeof import('../admin/paths')>('../admin/paths')
  return {
    ...actual,
    getAdminRouteConfig: getAdminRouteConfigMock,
  }
})

vi.mock('../pages/admin/LoginPage', () => ({
  default: () => <div>Admin login</div>,
  consumePrimedAdminSession: () => null,
}))

vi.mock('../pages/admin/DashboardPage', () => ({
  default: () => <div>Admin dashboard</div>,
}))

vi.mock('../pages/admin/ArchiveEditPage', () => ({
  default: () => <div>Archive edit</div>,
}))

describe('App', () => {
  it('renders admin routes on the admin host', async () => {
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: true,
      isLocalDevHost: false,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      archiveEditPath: '/archive/:id/edit',
    })

    window.history.replaceState(window.history.state, '', '/dashboard')

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(getAdminRouteConfigMock).toHaveBeenCalled()
    })
  })
})
