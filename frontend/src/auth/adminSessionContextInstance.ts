import { createContext } from 'react'
import type { AdminSessionState } from './useAdminSession'

export const AdminSessionContext = createContext<AdminSessionState | null>(null)
