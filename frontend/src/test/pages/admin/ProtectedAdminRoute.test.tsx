import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../../../App'
import ProtectedAdminRoute from '../../../pages/admin/ProtectedAdminRoute'

const useAdminSessionMock = vi.hoisted(() => vi.fn())
const getAdminRouteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('../../../auth/useAdminSession', () => ({
  useAdminSession: useAdminSessionMock,
}))

vi.mock('../../../admin/paths', async () => {
  const actual = await vi.importActual<typeof import('../../../admin/paths')>('../../../admin/paths')
  return {
    ...actual,
    getAdminRouteConfig: getAdminRouteConfigMock,
  }
})

vi.mock('../../../pages/admin/LoginPage', () => ({
  default: LoginPageProbe,
}))

vi.mock('../../../pages/admin/DashboardPage', () => ({
  default: () => <div>Dashboard page</div>,
}))

vi.mock('../../../pages/admin/ArchiveEditPage', () => ({
  default: () => <div>Archive edit page</div>,
}))

vi.mock('../../../pages/admin/CreateBlogPage', () => ({
  default: () => <div>Create blog page</div>,
}))

vi.mock('../../../i18n', async () => {
  const actual = await vi.importActual<typeof import('../../../i18n')>('../../../i18n')
  return actual
})

function LoginPageProbe() {
  const location = useLocation()
  const fromPath = (location.state as { from?: string } | null)?.from ?? 'missing'

  return <div>Login page from {fromPath}</div>
}

describe('ProtectedAdminRoute', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.unstubAllGlobals()
  })

  it('redirects logged-out admin-host dashboard visits to the login route', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
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
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'admin.example.test',
      pathname: '/dashboard',
      search: '',
      hash: '',
      assign: vi.fn(),
    } as Location)

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from /dashboard')).toBeInTheDocument()
    })

    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument()
  })

  it('routes logged-out localhost admin entry visits to /admin/login', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    window.history.replaceState(window.history.state, '', '/admin')
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'localhost',
      pathname: '/admin',
      search: '',
      hash: '',
      assign: vi.fn(),
    } as Location)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from missing')).toBeInTheDocument()
    })

    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument()
  })

  it('redirects logged-out localhost dashboard visits to /admin/login', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })

    render(
      <MemoryRouter initialEntries={['/admin/dashboard']}>
        <Routes>
          <Route
            path="/admin/dashboard"
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
      expect(screen.getByText('Login page from /admin/dashboard')).toBeInTheDocument()
    })

    expect(screen.queryByText('Secret')).not.toBeInTheDocument()
  })

  it('redirects logged-out visits to /admin/blogs/create to /admin/login', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    render(
      <MemoryRouter initialEntries={['/admin/blogs/create']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from /admin/blogs/create')).toBeInTheDocument()
    })

    expect(screen.queryByText('Create blog page')).not.toBeInTheDocument()
  })

  it('renders the admin 404 page for unknown /admin/* paths', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin', '/dashboard', '/'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    render(
      <MemoryRouter initialEntries={['/admin/willekeurig']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /(naar dashboard|back to dashboard)/i })).toBeInTheDocument()
    })

    expect(screen.queryByText(/Login page from/i)).not.toBeInTheDocument()
  })

  it('routes authenticated localhost admin entry visits to /admin/dashboard', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: true })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    window.history.replaceState(window.history.state, '', '/admin')
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'localhost',
      pathname: '/admin',
      search: '',
      hash: '',
      assign: vi.fn(),
    } as Location)

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Login page from/i)).not.toBeInTheDocument()
  })

  it('redirects logged-out admin entry visits to /login on the admin host', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: true,
      isLocalDevHost: false,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      archiveEditPath: '/archive/:id/edit',
    })

    window.history.replaceState(window.history.state, '', '/')
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'admin.example.test',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
    } as Location)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from missing')).toBeInTheDocument()
    })

    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument()
  })

  it('routes authenticated admin entry visits to /dashboard on the admin host', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: true })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: true,
      isLocalDevHost: false,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      archiveEditPath: '/archive/:id/edit',
    })

    window.history.replaceState(window.history.state, '', '/')
    vi.stubGlobal('location', {
      ...window.location,
      hostname: 'admin.example.test',
      pathname: '/',
      search: '',
      hash: '',
      assign: vi.fn(),
    } as Location)

    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Dashboard page')).toBeInTheDocument()
    })

    expect(screen.queryByText(/Login page from/i)).not.toBeInTheDocument()
  })

  it('redirects logged-out localhost login shell visits from /admin to /admin/login', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from missing')).toBeInTheDocument()
    })
  })

  it('redirects logged-out admin-host login shell visits from /login', async () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: true,
      isLocalDevHost: false,
      canRenderAdminRoutes: true,
      loginPath: '/login',
      dashboardPath: '/dashboard',
      legacyDashboardPaths: ['/'],
      archiveEditPath: '/archive/:id/edit',
    })

    render(
      <MemoryRouter initialEntries={['/login']}>
        <App />
      </MemoryRouter>,
    )

    await waitFor(() => {
      expect(screen.getByText('Login page from missing')).toBeInTheDocument()
    })
  })

  it('does not mount localhost /dashboard as an admin route anymore', () => {
    useAdminSessionMock.mockReturnValue({ isLoading: false, isAuthenticated: false })
    getAdminRouteConfigMock.mockReturnValue({
      isAdminHost: false,
      isLocalDevHost: true,
      canRenderAdminRoutes: true,
      loginPath: '/admin/login',
      dashboardPath: '/admin/dashboard',
      legacyDashboardPaths: ['/admin'],
      archiveEditPath: '/admin/archive/:id/edit',
    })

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <App />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Dashboard page')).not.toBeInTheDocument()
    expect(screen.queryByText(/Login page from/i)).not.toBeInTheDocument()
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
