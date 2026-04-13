import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import LoginPage from './LoginPage'

const navigate = vi.fn()
const getAdminRouteConfigMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigate,
  }
})

vi.mock('../../admin/paths', async () => {
  const actual = await vi.importActual<typeof import('../../admin/paths')>('../../admin/paths')
  return {
    ...actual,
    getAdminRouteConfig: getAdminRouteConfigMock,
  }
})

function createJsonResponse(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

describe('LoginPage', () => {
  beforeEach(() => {
    navigate.mockReset()
    getAdminRouteConfigMock.mockReset()
    getAdminRouteConfigMock.mockReturnValue({ dashboardPath: '/admin' })
    window.history.replaceState(window.history.state, '', '/')
    localStorage.setItem('locale', 'nl')
    document.documentElement.lang = 'nl'
    document.documentElement.dataset.theme = 'light'
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('disables submit until the required credentials are filled in', () => {
    vi.stubGlobal('fetch', vi.fn())

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/login', state: { from: '/admin/archive/42/edit?tab=metadata#notes' } }]}>
        <LoginPage />
      </MemoryRouter>,
    )

    const submitButton = screen.getByRole('button', { name: 'Inloggen' })
    expect(submitButton).toBeDisabled()

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'admin12345' },
    })

    expect(submitButton).toBeEnabled()
  })

  it('logs in, validates the session, and navigates to the requested admin route when present', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse(200, { success: true }))
      .mockResolvedValueOnce(createJsonResponse(200, {
        user: { sub: '1', username: 'admin', role: 'ADMIN' },
      }))

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={[{ pathname: '/admin/login', state: { from: '/admin/archive/42/edit?tab=metadata#notes' } }]}>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'admin12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2)
      expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/auth/login')
      expect(fetchMock.mock.calls[1]?.[0]).toBe('/api/auth/me')
      expect(navigate).toHaveBeenCalledWith('/admin/archive/42/edit?tab=metadata#notes', { replace: true })
    })
  })

  it('falls back to the host-specific dashboard path when no redirect state is present', async () => {
    getAdminRouteConfigMock.mockReturnValue({ dashboardPath: '/dashboard' })

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createJsonResponse(200, { success: true }))
      .mockResolvedValueOnce(createJsonResponse(200, {
        user: { sub: '1', username: 'admin', role: 'ADMIN' },
      }))

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'admin12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  it('shows an inline message for invalid credentials', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse(401, { message: 'Invalid credentials' }),
    )

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'foutwachtwoord' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(await screen.findByText('Ongeldige inloggegevens.')).toBeInTheDocument()
    expect(navigate).not.toHaveBeenCalled()
  })

  it('shows a dedicated message when the backend rate limit is hit', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse(429, { error: 'Too many login attempts' }),
    )

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'foutwachtwoord' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(await screen.findByText('Te veel inlogpogingen. Probeer het straks opnieuw.')).toBeInTheDocument()
  })

  it('retranslates the inline error when the locale changes after a failed login', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      createJsonResponse(401, { message: 'Invalid credentials' }),
    )

    vi.stubGlobal('fetch', fetchMock)

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'foutwachtwoord' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(await screen.findByText('Ongeldige inloggegevens.')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Wissel taal' }))

    await waitFor(() => {
      expect(screen.getByText('Your login details are incorrect.')).toBeInTheDocument()
    })
  })

  it('switches the admin copy immediately when the locale toggle is clicked', async () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    const localeToggle = screen.getByRole('button', { name: 'Wissel taal' })
    expect(localeToggle).toHaveTextContent('EN')
    expect(screen.getByRole('button', { name: 'Inloggen' })).toBeInTheDocument()

    fireEvent.click(localeToggle)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Wissel taal' })).toHaveTextContent('NL')
    })
  })

  it('does not render a password reset control', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.queryByText('Wachtwoord vergeten?')).not.toBeInTheDocument()
    expect(screen.queryByText('Forgot password?')).not.toBeInTheDocument()
  })

  it('renders footer navigation as static placeholder copy', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Archief')).toBeInTheDocument()
    expect(screen.queryByText(/Binnenkort beschikbaar/i)).not.toBeInTheDocument()
  })

  it('falls back to a generic error when the request fails unexpectedly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValueOnce(new Error('Network down')))

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    )

    fireEvent.change(screen.getByLabelText('Emailadres of gebruikersnaam'), {
      target: { value: 'admin' },
    })
    fireEvent.change(screen.getByLabelText('Wachtwoord'), {
      target: { value: 'admin12345' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Inloggen' }))

    expect(await screen.findByText('Inloggen lukt momenteel niet.')).toBeInTheDocument()
  })
})
