import type { PropsWithChildren } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/AuthProvider'

export function PublicLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth()

  return (
    <div className="cinema-page min-h-svh text-[var(--color-text-primary)]">
      <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(9,9,11,0.84)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link to="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]">
            <span className="h-8 w-1 rounded-full bg-[var(--color-accent)] shadow-[0_0_24px_rgba(124,58,237,0.82)]" />
            <span>Rewndly</span>
          </Link>
          <nav className="scrollbar-cinema flex gap-2 overflow-x-auto pb-1 text-sm text-[var(--color-text-secondary)] sm:flex-wrap sm:justify-end sm:overflow-visible sm:pb-0">
            <NavLink to="/movies/search" className={({ isActive }) => navClass(isActive)}>
              Peliculas
            </NavLink>
            <NavLink to="/series/search" className={({ isActive }) => navClass(isActive)}>
              Series
            </NavLink>
            <NavLink to="/lists/public" className={({ isActive }) => navClass(isActive)}>
              Listas
            </NavLink>
            <NavLink to="/reviews/public" className={({ isActive }) => navClass(isActive)}>
              Resenas
            </NavLink>
            {isAuthenticated ? (
              <>
                <NavLink to="/feed" className={({ isActive }) => navClass(isActive)}>
                  Feed
                </NavLink>
                <Link to="/me" className="shrink-0 rounded-[var(--radius-sm)] bg-white/[0.08] px-3 py-2 text-white hover:bg-white/[0.12]">
                  {user?.username}
                </Link>
              </>
            ) : (
              <Link to="/login" className="shrink-0 rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] px-3 py-2 text-violet-100 hover:bg-[rgba(124,58,237,0.24)]">
                Ingresar
              </Link>
            )}
          </nav>
        </div>
      </header>
      {children}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Rewndly</span>
          <span>
            Datos e imagenes provistos por{' '}
            <a className="text-violet-200 underline-offset-4 hover:underline" href="https://www.themoviedb.org/" target="_blank" rel="noreferrer">
              TMDB
            </a>
            . Rewndly no esta afiliado ni respaldado por TMDB.
          </span>
        </div>
      </footer>
    </div>
  )
}

function navClass(isActive: boolean) {
  return `shrink-0 rounded-[var(--radius-sm)] px-3 py-2 transition ${
    isActive ? 'bg-white/10 text-white' : 'hover:bg-white/[0.06] hover:text-white'
  }`
}
