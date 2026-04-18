import { useEffect, useState } from 'react'
import { getAdminSession } from '../api/adminAuth'
import type { SessionUser } from '../api/adminAuth'
import { consumePrimedAdminSession } from './primedAdminSession'

export type AdminSessionState = {
  isLoading: boolean
  isAuthenticated: boolean
  user: SessionUser | null
}

function getIdleSessionState(): AdminSessionState {
  return {
    isLoading: false,
    isAuthenticated: false,
    user: null,
  }
}

function getLoadingSessionState(): AdminSessionState {
  return {
    isLoading: true,
    isAuthenticated: false,
    user: null,
  }
}

export function useAdminSession(enabled = true): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>(() => (
    enabled ? getLoadingSessionState() : getIdleSessionState()
  ))

  useEffect(() => {
    if (!enabled) {
      setState((current) => (
        current.isLoading || current.isAuthenticated || current.user
          ? getIdleSessionState()
          : current
      ))
      return
    }

    const primedSession = consumePrimedAdminSession()
    if (primedSession) {
      setState({ isLoading: false, isAuthenticated: true, user: primedSession.data })
      return
    }

    let isActive = true

    getAdminSession()
      .then((response) => {
        if (isActive) {
          setState({ isLoading: false, isAuthenticated: true, user: response.data })
        }
      })
      .catch(() => {
        if (isActive) {
          setState(getIdleSessionState())
        }
      })

    return () => {
      isActive = false
    }
  }, [enabled])

  return state
}
