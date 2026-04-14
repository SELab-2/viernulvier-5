import { useEffect, useState } from 'react'
import { getAdminSession } from '../api/adminAuth'
import { consumePrimedAdminSession } from './primedAdminSession'

export type AdminSessionState = {
  isLoading: boolean
  isAuthenticated: boolean
}

export function useAdminSession(): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>({
    isLoading: true,
    isAuthenticated: false,
  })

  useEffect(() => {
    const primedSession = consumePrimedAdminSession()
    if (primedSession) {
      setState({ isLoading: false, isAuthenticated: true })
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
  }, [])

  return state
}
