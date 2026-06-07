import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

export function MePage() {
  const { user, changePassword, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const passwordIssues = validatePassword(newPassword)
  const canSubmitPassword =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmNewPassword.length > 0 &&
    passwordIssues.length === 0 &&
    newPassword === confirmNewPassword &&
    newPassword !== currentPassword

  async function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSuccess(null)

    if (!currentPassword) {
      setError('Completa el password actual.')
      return
    }

    if (passwordIssues.length > 0) {
      setError(passwordIssues.join(' '))
      return
    }

    if (newPassword !== confirmNewPassword) {
      setError('La confirmacion no coincide con el password nuevo.')
      return
    }

    if (newPassword === currentPassword) {
      setError('El password nuevo debe ser distinto al actual.')
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setSuccess('Password actualizado correctamente.')
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'No se pudo cambiar el password. Revisa los datos e intenta de nuevo.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Mi cuenta</p>
          <h1 className="mt-3 text-4xl font-semibold">{user?.displayName}</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-secondary)]">
            Revisa tus datos, entra rapido a tu actividad y mantene seguro el acceso a tu cuenta.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.74fr)]">
          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="kicker">Perfil</p>
                <h2 className="mt-3 text-2xl font-semibold">{user?.displayName}</h2>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">@{user?.username}</p>
              </div>
              <button onClick={() => void logout()} className="secondary-action w-fit">
                Cerrar sesion
              </button>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProfileData label="Email" value={user?.email ?? '-'} />
              <ProfileData label="Rol" value={user?.role ?? '-'} />
              <ProfileData label="Estado del email" value={user?.emailVerifiedAt ? 'Verificado' : 'Pendiente de verificar'} />
              <ProfileData label="Password" value={user?.mustChangePassword ? 'Cambio requerido' : 'Al dia'} />
            </dl>

            {user?.mustChangePassword ? (
              <p className="mt-5 rounded-[var(--radius-sm)] border border-amber-300/24 bg-amber-400/10 p-3 text-sm text-amber-100">
                Tenes un password temporal o inicial. Cambialo desde el panel de seguridad.
              </p>
            ) : null}

            <nav className="mt-6 grid gap-3 sm:grid-cols-4">
              <Link to="/me/library" className="secondary-action justify-start">
                Biblioteca
              </Link>
              <Link to="/me/reviews" className="secondary-action justify-start">
                Resenas
              </Link>
              <Link to="/me/lists" className="secondary-action justify-start">
                Listas
              </Link>
              <Link to="/me/tmdb" className="secondary-action justify-start">
                TMDB
              </Link>
            </nav>
          </section>

          <section className="surface-panel p-5 sm:p-6">
            <p className="kicker">Seguridad</p>
            <h2 className="mt-3 text-2xl font-semibold">Cambiar password</h2>
            <form onSubmit={submitPassword} className="mt-5 grid gap-4">
              <label className="block text-sm text-[var(--color-text-secondary)]">
                Password actual
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(event) => setCurrentPassword(event.target.value)}
                  className="field mt-2"
                  autoComplete="current-password"
                />
              </label>
              <label className="block text-sm text-[var(--color-text-secondary)]">
                Password nuevo
                <input
                  type="password"
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  className="field mt-2"
                  autoComplete="new-password"
                />
              </label>
              <label className="block text-sm text-[var(--color-text-secondary)]">
                Confirmar password nuevo
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(event) => setConfirmNewPassword(event.target.value)}
                  className="field mt-2"
                  autoComplete="new-password"
                />
              </label>

              <ul className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
                <PasswordRule passed={newPassword.length >= 8} label="Minimo 8 caracteres" />
                <PasswordRule passed={/[A-Z]/.test(newPassword)} label="Una mayuscula" />
                <PasswordRule passed={/[a-z]/.test(newPassword)} label="Una minuscula" />
                <PasswordRule passed={/[0-9]/.test(newPassword)} label="Un numero" />
                <PasswordRule passed={/[^a-zA-Z0-9]/.test(newPassword)} label="Un simbolo" />
                <PasswordRule passed={!newPassword || newPassword !== currentPassword} label="Distinto al actual" />
                <PasswordRule passed={!confirmNewPassword || newPassword === confirmNewPassword} label="Confirmacion igual" />
              </ul>

              {error ? <StatusMessage tone="error" message={error} /> : null}
              {success ? <StatusMessage tone="success" message={success} /> : null}

              <button type="submit" disabled={!canSubmitPassword || isSubmitting} className="primary-action">
                Actualizar password
              </button>
            </form>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

function ProfileData({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.035] p-3">
      <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">{label}</dt>
      <dd className="mt-1 text-sm text-resilient text-[var(--color-text-primary)]">{value}</dd>
    </div>
  )
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return <li className={passed ? 'text-emerald-200' : 'text-[var(--color-text-secondary)]'}>{passed ? 'OK' : '-'} {label}</li>
}

function StatusMessage({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const classes =
    tone === 'success'
      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
      : 'border-red-300/20 bg-red-950/25 text-red-200'

  return <p className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${classes}`}>{message}</p>
}

function validatePassword(password: string) {
  const issues: string[] = []
  if (password.length < 8) {
    issues.push('El password nuevo debe tener al menos 8 caracteres.')
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Debe tener al menos una mayuscula.')
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Debe tener al menos una minuscula.')
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Debe tener al menos un numero.')
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Debe tener al menos un simbolo.')
  }

  return issues
}
