import { useEffect, useState } from 'react'
import { getAdminSession } from '../api/adminAuth'
import { consumePrimedAdminSession } from './primedAdminSession'

export type AdminSessionState = {
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>(() => {
    const primedSession = consumePrimedAdminSession()

    if (primedSession) {
      return { isLoading: false, isAuthenticated: true }
    }

    return {
      isLoading: true,
      isAuthenticated: false,
    }
  })

  useEffect(() => {
    if (!state.isLoading) {
      return
    }

    let isActive = true

    getAdminSession()
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
  }, [state.isLoading])

  return state
}
