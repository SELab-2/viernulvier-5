import type { SessionResponse } from '../api/adminAuth'

let primedAdminSession: SessionResponse | null = null

export function primeAdminSession(session: SessionResponse) {
  primedAdminSession = session
}

export function consumePrimedAdminSession(): SessionResponse | null {
  const session = primedAdminSession
  primedAdminSession = null
  return session
}

export function clearPrimedAdminSession() {
  primedAdminSession = null
}
