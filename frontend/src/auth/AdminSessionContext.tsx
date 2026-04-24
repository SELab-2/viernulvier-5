import { AdminSessionContext } from './adminSessionContextInstance'
import type { ReactNode } from 'react'
import type { AdminSessionState } from './useAdminSession'

type AdminSessionProviderProps = {
  value: AdminSessionState
  children: ReactNode
}

export function AdminSessionProvider({ value, children }: AdminSessionProviderProps) {
  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>
}
