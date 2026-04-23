import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getAdminSession, loginAdmin, logoutAdmin } from '../../api/adminAuth'

const fetchMock = vi.fn()

vi.stubGlobal('fetch', fetchMock)

describe('adminAuth', () => {
  beforeEach(() => {
    fetchMock.mockReset()
  })

  it('posts login requests to the versioned auth endpoint and returns the session user', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce({
        data: { user: { id: '1', username: 'admin', role: 'ADMIN' } },
      }),
    } as unknown as Response)

    const session = await loginAdmin(' admin ', 'secret')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/login',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ username: 'admin', password: 'secret' }),
      }),
    )
    expect(session).toEqual({ data: { id: '1', username: 'admin', role: 'ADMIN' } })
  })

  it('reads the current session from the versioned auth endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce({ data: { id: '1', username: 'admin', role: 'ADMIN' } }),
    } as unknown as Response)

    await getAdminSession()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/me',
      expect.objectContaining({
        credentials: 'include',
      }),
    )
  })

  it('posts logout requests to the versioned auth endpoint', async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValueOnce({ data: { success: true } }),
    } as unknown as Response)

    await logoutAdmin()

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/auth/logout',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({}),
      }),
    )
  })
})
