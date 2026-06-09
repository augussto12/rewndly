import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { api } from '../api/client'
import { login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/services'
import type { AuthUser, MobileAuthResponse } from '../api/types'
import { getRefreshToken, setAccessToken, setRefreshToken } from './tokenStore'

type AuthContextValue = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (identifier: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function restore() {
      try {
        const refreshToken = await getRefreshToken()
        if (!refreshToken) {
          return
        }

        const auth = await api<MobileAuthResponse>('/api/mobile/auth/refresh', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
          skipRefresh: true
        })

        if (!cancelled) {
          await persistAuth(auth)
          setUser(auth.user)
        }
      } catch {
        if (!cancelled) {
          setAccessToken(null)
          await setRefreshToken(null)
          setUser(null)
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void restore()
    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (identifier: string, password: string) => {
    const auth = await loginRequest(identifier, password)
    await persistAuth(auth)
    setUser(auth.user)
  }, [])

  const register = useCallback(async (username: string, email: string, password: string) => {
    const auth = await registerRequest(username, email, password)
    await persistAuth(auth)
    setUser(auth.user)
  }, [])

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken()
    try {
      if (user) {
        await logoutRequest(refreshToken)
      }
    } finally {
      setAccessToken(null)
      await setRefreshToken(null)
      setUser(null)
    }
  }, [user])

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout
  }), [isLoading, login, logout, register, user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }

  return value
}

async function persistAuth(auth: MobileAuthResponse) {
  setAccessToken(auth.accessToken)
  await setRefreshToken(auth.refreshToken)
}
