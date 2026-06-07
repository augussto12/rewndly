import { createContext } from 'react'
import type { AuthUser, ChangePasswordRequest, LoginRequest, RegisterRequest } from './types/auth.types'

export type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  changePassword: (request: ChangePasswordRequest) => Promise<void>
  logout: () => Promise<void>
  reloadMe: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
