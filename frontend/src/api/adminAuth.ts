import { api } from './client'

export type SessionUser = {
  id: string
  username: string
  role: string
}

export type SessionResponse = {
  data: SessionUser
}

type LoginResponse = {
  data: {
    user: SessionUser
  }
}

export async function loginAdmin(username: string, password: string): Promise<SessionResponse> {
  const response = await api.post<LoginResponse>('/auth/login', {
    username: username.trim(),
    password,
  })
  return { data: response.data.user }
}

export function getAdminSession(): Promise<SessionResponse> {
  return api.get<SessionResponse>('/auth/me')
}

export function logoutAdmin(): Promise<{ data: { success: boolean } }> {
  return api.post<{ data: { success: boolean } }>('/auth/logout', {})
}
