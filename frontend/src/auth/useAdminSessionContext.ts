import { useContext } from 'react'
import { AdminSessionContext } from './adminSessionContextInstance'
import type { AdminSessionState } from './useAdminSession'

export function useAdminSessionContext(): AdminSessionState {
  const session = useContext(AdminSessionContext)
  if (!session) {
    throw new Error('useAdminSessionContext must be used inside an AdminSessionProvider')
  }
  return session
}

export function useOptionalAdminSession(): AdminSessionState | null {
  return useContext(AdminSessionContext)
}
