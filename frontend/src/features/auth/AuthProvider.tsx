import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { login, logout, me, refreshSession, register } from './services/authApi'
import { setAccessToken } from './services/authTokenStore'
import type { AuthUser, LoginRequest, RegisterRequest } from './types/auth.types'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (request: LoginRequest) => Promise<void>
  register: (request: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  reloadMe: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const reloadMe = useCallback(async () => {
    const currentUser = await me()
    setUser(currentUser)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function restoreSession() {
      try {
        const auth = await refreshSession()
        if (!cancelled) {
          setAccessToken(auth.accessToken)
          setUser(auth.user)
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restoreSession()

    return () => {
      cancelled = true
    }
  }, [])

  const handleLogin = useCallback(async (request: LoginRequest) => {
    const auth = await login(request)
    setAccessToken(auth.accessToken)
    setUser(auth.user)
  }, [])

  const handleRegister = useCallback(async (request: RegisterRequest) => {
    const auth = await register(request)
    setAccessToken(auth.accessToken)
    setUser(auth.user)
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
    } finally {
      setAccessToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      isLoading,
      login: handleLogin,
      register: handleRegister,
      logout: handleLogout,
      reloadMe,
    }),
    [handleLogin, handleLogout, handleRegister, isLoading, reloadMe, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return value
}
