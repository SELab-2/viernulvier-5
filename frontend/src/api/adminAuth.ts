import { api } from './client'

export type SessionUser = {
  sub: string
  username: string
  role: string
}

export type SessionResponse = {
  user: SessionUser
}

export function loginAdmin(username: string, password: string): Promise<unknown> {
  return api.post('/auth/login', {
    username: username.trim(),
    password,
  })
}

export function getAdminSession(): Promise<SessionResponse> {
  return api.get<SessionResponse>('/auth/me')
}
