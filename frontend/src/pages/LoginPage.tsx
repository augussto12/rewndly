import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PasswordField } from '../components/forms/PasswordField'
import { useAuth } from '../features/auth/useAuth'
import { APP_VERSION } from '../lib/appVersion'
import { ApiError, getErrorMessage } from '../services/apiError'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await login({ identifier, password })
      navigate('/me')
    } catch (error) {
      setError(
        error instanceof ApiError && error.status === 401
          ? 'No encontramos una cuenta con ese correo/usuario y contraseña.'
          : getErrorMessage(error, 'No se pudo iniciar sesión. Probá nuevamente.'),
      )
    }
  }

  return (
    <main className="cinema-page grid min-h-svh place-items-center px-5 py-8 text-[var(--color-text-primary)]">
      <form onSubmit={handleSubmit} className="surface-panel w-full max-w-md p-6 sm:p-7">
        <Link to="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          Rewndly
        </Link>
        <p className="kicker mt-8">Sesión</p>
        <h1 className="mt-3 text-3xl font-semibold">Ingresar</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Llevá el registro de lo que viste, lo que querés ver y lo que te pareció.
        </p>
        <label className="mt-6 block text-sm text-[var(--color-text-secondary)]">
          Correo o usuario
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="field mt-2" autoComplete="username" />
        </label>
        <PasswordField label="Contraseña" value={password} onChange={setPassword} autoComplete="current-password" className="mt-4" />
        {error ? <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <button className="primary-action mt-6 w-full">Entrar</button>
        <Link to="/register" className="mt-4 block text-center text-sm text-[var(--color-text-secondary)] hover:text-white">
          Crear cuenta
        </Link>
        <p className="mt-5 text-center text-[0.65rem] font-medium text-[var(--color-text-tertiary)] opacity-60">v{APP_VERSION}</p>
      </form>
    </main>
  )
}
