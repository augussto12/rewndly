import { useState } from 'react'
import type { FormEvent, SVGProps } from 'react'
import { Link } from 'react-router-dom'
import { PasswordField } from '../components/forms/PasswordField'
import { toast } from '../components/feedback/Toast/toastStore'
import { UserAvatar } from '../components/user/UserAvatar'
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
      const message = 'Completá la contraseña actual.'
      setError(message)
      toast.error('Falta un dato', message)
      return
    }

    if (passwordIssues.length > 0) {
      const message = passwordIssues.join(' ')
      setError(message)
      toast.error('Contraseña inválida', message)
      return
    }

    if (newPassword !== confirmNewPassword) {
      const message = 'La confirmación no coincide con la contraseña nueva.'
      setError(message)
      toast.error('Confirmación incorrecta', message)
      return
    }

    if (newPassword === currentPassword) {
      const message = 'La contraseña nueva debe ser distinta a la actual.'
      setError(message)
      toast.error('Contraseña repetida', message)
      return
    }

    setIsSubmitting(true)
    try {
      await changePassword({ currentPassword, newPassword, confirmNewPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmNewPassword('')
      setSuccess('Contraseña actualizada correctamente.')
    } catch (actionError) {
      setError(getErrorMessage(actionError, 'No se pudo cambiar la contraseña. Revisá los datos e intentá de nuevo.'))
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
            Revisá tus datos, accedé a tu actividad y mantené seguro el acceso a tu cuenta.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,0.74fr)]">
          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-4">
                <UserAvatar displayName={user?.displayName} username={user?.username} size="lg" className="shrink-0" />
                <div className="min-w-0">
                  <p className="kicker">Perfil</p>
                  <h2 className="mt-3 truncate text-2xl font-semibold">@{user?.username}</h2>
                </div>
              </div>
              <button onClick={() => void logout()} className="secondary-action w-fit">
                Cerrar sesión
              </button>
            </div>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2">
              <ProfileData label="Correo" value={user?.email ?? '-'} />
              {user?.role === 'Admin' ? <ProfileData label="Rol" value="Admin" tone="admin" /> : null}
              <ProfileData label="Estado del correo" value={user?.emailVerifiedAt ? 'Verificado' : 'Pendiente de verificar'} />
              <ProfileData label="Contraseña" value={user?.mustChangePassword ? 'Cambio requerido' : 'Al día'} />
            </dl>

            {user?.mustChangePassword ? (
              <p className="mt-5 rounded-[var(--radius-sm)] border border-amber-300/24 bg-amber-400/10 p-3 text-sm text-amber-100">
                Tenés una contraseña temporal. Cambiala desde el panel de seguridad.
              </p>
            ) : null}

            <nav className="mt-6 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <Link to="/me/library" className={accountLinkClass}>
                <LibraryIcon />
                Biblioteca
              </Link>
              <Link to="/me/reviews" className={accountLinkClass}>
                <ReviewIcon />
                Reseñas
              </Link>
              <Link to="/me/lists" className={accountLinkClass}>
                <ListIcon />
                Listas
              </Link>
              <Link to="/me/tmdb" className={accountLinkClass}>
                <TmdbIcon />
                TMDB
              </Link>
            </nav>
          </section>

          <section className="surface-panel p-5 sm:p-6">
            <p className="kicker">Seguridad</p>
            <h2 className="mt-3 text-2xl font-semibold">Cambiar contraseña</h2>
            <form onSubmit={submitPassword} className="mt-5 grid gap-4">
              <PasswordField label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
              <PasswordField label="Contraseña nueva" value={newPassword} onChange={setNewPassword} autoComplete="new-password" />
              <PasswordField label="Confirmar contraseña nueva" value={confirmNewPassword} onChange={setConfirmNewPassword} autoComplete="new-password" />

              <ul className="grid gap-1 text-xs text-[var(--color-text-secondary)]">
                <PasswordRule passed={newPassword.length >= 8} label="Mínimo 8 caracteres" />
                <PasswordRule passed={/[A-Z]/.test(newPassword)} label="Una mayúscula" />
                <PasswordRule passed={/[a-z]/.test(newPassword)} label="Una minúscula" />
                <PasswordRule passed={/[0-9]/.test(newPassword)} label="Un número" />
                <PasswordRule passed={/[^a-zA-Z0-9]/.test(newPassword)} label="Un símbolo" />
                <PasswordRule passed={!newPassword || newPassword !== currentPassword} label="Distinto al actual" />
                <PasswordRule passed={!confirmNewPassword || newPassword === confirmNewPassword} label="Confirmación igual" />
              </ul>

              {error ? <StatusMessage tone="error" message={error} /> : null}
              {success ? <StatusMessage tone="success" message={success} /> : null}

              <button type="submit" disabled={!canSubmitPassword || isSubmitting} className="primary-action">
                Actualizar contraseña
              </button>
            </form>
          </section>
        </div>
      </main>
    </PublicLayout>
  )
}

const accountLinkClass =
  'group flex min-h-12 items-center gap-2 rounded-[var(--radius-sm)] border border-violet-200/14 bg-[linear-gradient(135deg,rgba(45,212,191,0.055),rgba(124,58,237,0.08),rgba(251,113,133,0.045))] px-3 py-2.5 text-sm font-semibold text-violet-50/86 transition hover:-translate-y-0.5 hover:border-violet-200/34 hover:bg-white/[0.07] hover:text-white'

function ProfileData({ label, value, tone = 'default' }: { label: string; value: string; tone?: 'default' | 'admin' }) {
  const classes =
    tone === 'admin'
      ? 'border-amber-300/25 bg-amber-400/10'
      : 'border-white/10 bg-white/[0.035]'
  const valueClasses = tone === 'admin' ? 'text-amber-100' : 'text-[var(--color-text-primary)]'

  return (
    <div className={`rounded-[var(--radius-sm)] border p-3 ${classes}`}>
      <dt className="text-xs font-semibold uppercase text-[var(--color-text-secondary)]">{label}</dt>
      <dd className={`mt-1 text-sm font-semibold text-resilient ${valueClasses}`}>{value}</dd>
    </div>
  )
}

function PasswordRule({ passed, label }: { passed: boolean; label: string }) {
  return (
    <li className={`flex items-center gap-1.5 ${passed ? 'text-emerald-200' : 'text-[var(--color-text-secondary)]'}`}>
      {passed ? (
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
      ) : (
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/></svg>
      )}
      {label}
    </li>
  )
}

function StatusMessage({ tone, message }: { tone: 'error' | 'success'; message: string }) {
  const classes =
    tone === 'success'
      ? 'border-emerald-300/20 bg-emerald-400/10 text-emerald-100'
      : 'border-red-300/20 bg-red-950/25 text-red-200'

  return <p className={`rounded-[var(--radius-sm)] border px-3 py-2 text-sm ${classes}`}>{message}</p>
}

function LibraryIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2Z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7Z" />
    </svg>
  )
}

function ReviewIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2Z" />
    </svg>
  )
}

function ListIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M8 6h13M8 12h13M8 18h13" />
      <path d="M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  )
}

function TmdbIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 15V9l4 3 4-3v6" />
    </svg>
  )
}

function validatePassword(password: string) {
  const issues: string[] = []
  if (password.length < 8) {
    issues.push('La contraseña nueva debe tener al menos 8 caracteres.')
  }
  if (!/[A-Z]/.test(password)) {
    issues.push('Debe tener al menos una mayúscula.')
  }
  if (!/[a-z]/.test(password)) {
    issues.push('Debe tener al menos una minúscula.')
  }
  if (!/[0-9]/.test(password)) {
    issues.push('Debe tener al menos un número.')
  }
  if (!/[^a-zA-Z0-9]/.test(password)) {
    issues.push('Debe tener al menos un símbolo.')
  }

  return issues
}
