import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function RegisterPage() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    try {
      await register({ username, email, password })
      navigate('/me')
    } catch {
      setError('No se pudo crear la cuenta.')
    }
  }

  return (
    <main className="grid min-h-svh place-items-center bg-[radial-gradient(circle_at_30%_10%,rgba(124,58,237,0.24),transparent_28rem),#09090b] px-5 py-8 text-[var(--color-text-primary)]">
      <form onSubmit={handleSubmit} className="surface-panel w-full max-w-md p-6 sm:p-7">
        <Link to="/" className="text-sm font-semibold uppercase tracking-[0.18em] text-white">
          Rewndly
        </Link>
        <p className="kicker mt-8">Cuenta</p>
        <h1 className="mt-3 text-3xl font-semibold">Crear cuenta</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
          Empeza con una biblioteca propia, resenas independientes y listas visibles segun tu privacidad.
        </p>
        <label className="mt-6 block text-sm text-[var(--color-text-secondary)]">
          Usuario
          <input value={username} onChange={(event) => setUsername(event.target.value)} className="field mt-2" autoComplete="username" />
        </label>
        <label className="mt-4 block text-sm text-[var(--color-text-secondary)]">
          Email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="field mt-2" autoComplete="email" />
        </label>
        <label className="mt-4 block text-sm text-[var(--color-text-secondary)]">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="field mt-2"
            autoComplete="new-password"
          />
        </label>
        {error ? <p className="mt-4 rounded-[var(--radius-sm)] border border-red-300/20 bg-red-950/25 px-3 py-2 text-sm text-red-200">{error}</p> : null}
        <button className="primary-action mt-6 w-full">Registrarse</button>
        <Link to="/login" className="mt-4 block text-center text-sm text-[var(--color-text-secondary)] hover:text-white">
          Ya tengo cuenta
        </Link>
      </form>
    </main>
  )
}
