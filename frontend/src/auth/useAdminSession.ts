import { useEffect, useState } from 'react'

type SessionUser = {
  sub: string
  username: string
  role: string
}

type SessionResponse = {
  user: SessionUser
}

type AdminSessionState = {
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    let isActive = true

    fetch('/api/v1/auth/me')
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Unauthorized')
        }

        return response.json() as Promise<SessionResponse>
      })
      .then(() => {
        if (isActive) {
          setState({ isLoading: false, isAuthenticated: true })
        }
      })
      .catch(() => {
        if (isActive) {
          setState({ isLoading: false, isAuthenticated: false })
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  return state
}
