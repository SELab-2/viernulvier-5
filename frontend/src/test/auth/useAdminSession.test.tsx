import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useAdminSession } from '../../auth/useAdminSession'

describe('useAdminSession', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('starts in a loading state before the session request resolves', () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () => new Promise(() => {}) as Promise<Response>,
    )

    const { result } = renderHook(() => useAdminSession())

    expect(result.current).toEqual({ isLoading: true, isAuthenticated: false, user: null })
  })

  it('marks the session as authenticated after a successful response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '1', username: 'admin', role: 'ADMIN' },
      }),
    } as Response)

    const { result } = renderHook(() => useAdminSession())

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        isAuthenticated: true,
        user: { id: '1', username: 'admin', role: 'ADMIN' },
      })
    })
  })

  it('marks the session as unauthenticated after a failed response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      json: async () => ({}),
    } as Response)

    const { result } = renderHook(() => useAdminSession())

    await waitFor(() => {
      expect(result.current).toEqual({ isLoading: false, isAuthenticated: false, user: null })
    })
  })

  it('does not update state after unmount', async () => {
    let resolveFetch: ((value: Response) => void) | undefined

    vi.spyOn(globalThis, 'fetch').mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve
        }),
    )

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { unmount } = renderHook(() => useAdminSession())

    unmount()

    await act(async () => {
      resolveFetch?.({
        ok: true,
        json: async () => ({
          data: { id: '1', username: 'admin', role: 'ADMIN' },
        }),
      } as Response)
      await Promise.resolve()
    })

    expect(consoleErrorSpy).not.toHaveBeenCalled()
  })

  it('stays idle and skips the session request when disabled', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch')

    const { result } = renderHook(() => useAdminSession(false))

    expect(result.current).toEqual({ isLoading: false, isAuthenticated: false, user: null })
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('resets to the idle state when disabled after authentication', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { id: '1', username: 'admin', role: 'ADMIN' },
      }),
    } as Response)

    const { result, rerender } = renderHook(({ enabled }) => useAdminSession(enabled), {
      initialProps: { enabled: true },
    })

    await waitFor(() => {
      expect(result.current).toEqual({
        isLoading: false,
        isAuthenticated: true,
        user: { id: '1', username: 'admin', role: 'ADMIN' },
      })
    })

    rerender({ enabled: false })

    await waitFor(() => {
      expect(result.current).toEqual({ isLoading: false, isAuthenticated: false, user: null })
    })
  })
})
