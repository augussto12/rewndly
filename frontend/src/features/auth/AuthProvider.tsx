import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'
import { changePassword, login, logout, me, refreshSession, register } from './services/authApi'
import { setAccessToken } from './services/authTokenStore'
import type { AuthUser, ChangePasswordRequest, LoginRequest, RegisterRequest } from './types/auth.types'

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

  const handleChangePassword = useCallback(async (request: ChangePasswordRequest) => {
    const updatedUser = await changePassword(request)
    setUser(updatedUser)
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
      changePassword: handleChangePassword,
      logout: handleLogout,
      reloadMe,
    }),
    [handleChangePassword, handleLogin, handleLogout, handleRegister, isLoading, reloadMe, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
