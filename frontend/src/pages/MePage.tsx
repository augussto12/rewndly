import { Link } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { PublicLayout } from '../layouts/PublicLayout'

export function MePage() {
  const { user, logout } = useAuth()

  return (
    <PublicLayout>
      <main className="page-shell">
        <section className="surface-panel mx-auto max-w-3xl p-6">
          <p className="kicker">Mi cuenta</p>
          <h1 className="mt-3 text-3xl font-semibold">{user?.displayName}</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">@{user?.username}</p>
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
          {user?.mustChangePassword ? (
            <p className="mt-4 rounded-[var(--radius-sm)] border border-violet-200/20 bg-[var(--color-accent-soft)] p-3 text-sm text-violet-100">
              Debes cambiar tu password inicial cuando la pantalla de cambio este disponible.
            </p>
          ) : null}
          <button onClick={() => void logout()} className="secondary-action mt-6">
            Cerrar sesion
          </button>
        </section>
      </main>
    </PublicLayout>
  )
}
