import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

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
    } catch {
      setError('Credenciales invalidas.')
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_30%_10%,rgba(124,58,237,0.24),transparent_28rem),#09090b] px-5 py-8 text-[var(--color-text-primary)]">
      <form onSubmit={handleSubmit} className="surface-panel w-full max-w-md p-6 sm:p-7">
        <Link to="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          Rewndly
        </Link>
        <p className="kicker mt-8">Sesion</p>
        <h1 className="mt-3 text-3xl font-semibold">Ingresar</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Volve a tu biblioteca, feed y listas sin exponer tokens sensibles en el navegador.
        </p>
        <label className="mt-6 block text-sm text-[var(--color-text-secondary)]">
          Email o usuario
          <input value={identifier} onChange={(event) => setIdentifier(event.target.value)} className="field mt-2" autoComplete="username" />
        </label>
        <label className="mt-4 block text-sm text-[var(--color-text-secondary)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            autoComplete="current-password"
          />
        </label>
        {error ? <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <button className="primary-action mt-6 w-full">Entrar</button>
        <Link to="/register" className="mt-4 block text-center text-sm text-[var(--color-text-secondary)] hover:text-white">
          Crear cuenta
        </Link>
      </form>
    </main>
  )
}
