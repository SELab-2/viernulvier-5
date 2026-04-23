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

function getEnabledInitialSessionState(): AdminSessionState {
  const primedSession = consumePrimedAdminSession()
  if (primedSession) {
    return { isLoading: false, isAuthenticated: true, user: primedSession.data }
  }
  return getLoadingSessionState()
}

export function useAdminSession(enabled = true): AdminSessionState {
  const [state, setState] = useState<AdminSessionState>(() => (
    enabled ? getEnabledInitialSessionState() : getIdleSessionState()
  ))
  const [prevEnabled, setPrevEnabled] = useState(enabled)

  if (prevEnabled !== enabled) {
    setPrevEnabled(enabled)
    setState(enabled ? getEnabledInitialSessionState() : getIdleSessionState())
  }

  useEffect(() => {
    if (!enabled || !state.isLoading) {
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
  }, [enabled, state.isLoading])

  return state
}
