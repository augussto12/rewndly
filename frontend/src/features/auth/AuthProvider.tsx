import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { toast } from '../../components/feedback/Toast/toastStore'
import { getErrorMessage } from '../../services/apiError'
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
    try {
      const auth = await login(request)
      setAccessToken(auth.accessToken)
      setUser(auth.user)
      toast.success('Sesion iniciada', `Hola, ${auth.user.displayName}.`)
    } catch (error) {
      toast.error('No se pudo iniciar sesión', getErrorMessage(error, 'Revisá tus credenciales e intentá de nuevo.'))
      throw error
    }
  }, [])

  const handleRegister = useCallback(async (request: RegisterRequest) => {
    try {
      const auth = await register(request)
      setAccessToken(auth.accessToken)
      setUser(auth.user)
      toast.success('Cuenta creada', 'Ya podés empezar a guardar contenido.')
    } catch (error) {
      toast.error('No se pudo crear la cuenta', getErrorMessage(error, 'Revisá los datos e intentá de nuevo.'))
      throw error
    }
  }, [])

  const handleChangePassword = useCallback(async (request: ChangePasswordRequest) => {
    try {
      const updatedUser = await changePassword(request)
      setUser(updatedUser)
      toast.success('Contraseña actualizada', 'Tu cuenta quedó con la contraseña nueva.')
    } catch (error) {
      toast.error('No se pudo cambiar la contraseña', getErrorMessage(error, 'Revisá los datos e intentá de nuevo.'))
      throw error
    }
  }, [])

  const handleLogout = useCallback(async () => {
    try {
      await logout()
      toast.success('Sesion cerrada', 'Volves a navegar como visitante.')
    } catch (error) {
      toast.error('No pudimos cerrar sesión en el servidor', getErrorMessage(error, 'La sesión local se va a limpiar igual.'))
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
