import { httpClient } from '../../../services/httpClient'
import type { AuthResponse, AuthUser, ChangePasswordRequest, LoginRequest, RegisterRequest } from '../types/auth.types'

export function register(request: RegisterRequest) {
  return httpClient<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function login(request: LoginRequest) {
  return httpClient<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function refreshSession() {
  return httpClient<AuthResponse>('/api/auth/refresh', {
    method: 'POST',
  })
}

export function logout() {
  return httpClient<void>('/api/auth/logout', {
    method: 'POST',
  })
}

export function logoutAll() {
  return httpClient<void>('/api/auth/logout-all', {
    method: 'POST',
  })
}

export function changePassword(request: ChangePasswordRequest) {
  return httpClient<AuthUser>('/api/auth/change-password', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

export function me() {
  return httpClient<AuthUser>('/api/auth/me')
}
