import { useState, type PropsWithChildren } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'

const publicLinks = [
  { href: '/movies/search', label: 'Peliculas' },
  { href: '/series/search', label: 'Series' },
  { href: '/discover', label: 'Explorar' },
  { href: '/people/search', label: 'Personas' },
  { href: '/lists/public', label: 'Listas' },
  { href: '/reviews/public', label: 'Resenas' },
]

export function PublicLayout({ children }: PropsWithChildren) {
  const { isAuthenticated, user } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="cinema-page flex min-h-svh flex-col text-[var(--color-text-primary)]">
      <header className="site-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex min-w-0 items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]">
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-play" />
            </span>
            <span className="truncate">Rewndly</span>
          </Link>
          <nav className="hidden items-center gap-2 text-sm text-[var(--color-text-secondary)] md:flex md:justify-end">
            {publicLinks.map((link) => (
              <NavLink key={link.href} to={link.href} className={({ isActive }) => navClass(isActive)}>
                {link.label}
              </NavLink>
            ))}
            {isAuthenticated ? (
              <>
                <NavLink to="/feed" className={({ isActive }) => navClass(isActive)}>
                  Feed
                </NavLink>
                <Link to="/me" className="text-resilient max-w-full rounded-[var(--radius-sm)] bg-white/[0.08] px-3 py-2 text-white hover:bg-white/[0.12]">
                  {user?.username}
                </Link>
              </>
            ) : (
              <Link to="/login" className="rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] px-3 py-2 text-violet-100 hover:bg-[rgba(124,58,237,0.24)]">
                Ingresar
              </Link>
            )}
          </nav>
          <button
            type="button"
            className="inline-grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] text-white transition hover:bg-white/[0.1] md:hidden"
            aria-label={isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-nav"
            onClick={() => setIsMenuOpen((value) => !value)}
          >
            <span className="sr-only">{isMenuOpen ? 'Cerrar menu' : 'Abrir menu'}</span>
            <span className="grid gap-1.5" aria-hidden="true">
              <span className={`block h-0.5 w-5 rounded-full bg-current transition ${isMenuOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-current transition ${isMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block h-0.5 w-5 rounded-full bg-current transition ${isMenuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </span>
          </button>
        </div>
        {isMenuOpen ? (
          <nav
            id="mobile-nav"
            className="absolute right-4 top-[calc(100%+0.5rem)] z-30 max-h-[calc(100svh-5rem)] w-[calc(100vw-2rem)] max-w-none overflow-y-auto rounded-[var(--radius-md)] border border-white/10 bg-[rgba(10,11,20,0.96)] p-3 text-sm text-[var(--color-text-secondary)] shadow-[0_24px_70px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:right-6 sm:w-80 sm:max-w-80 md:hidden"
          >
            <div className="grid gap-2">
              {publicLinks.map((link) => (
                <NavLink key={link.href} to={link.href} onClick={() => setIsMenuOpen(false)} className={({ isActive }) => mobileNavClass(isActive)}>
                  {link.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  <NavLink to="/feed" onClick={() => setIsMenuOpen(false)} className={({ isActive }) => mobileNavClass(isActive)}>
                    Feed
                  </NavLink>
                  <Link
                    to="/me"
                    onClick={() => setIsMenuOpen(false)}
                    className="text-resilient rounded-[var(--radius-sm)] bg-white/[0.08] px-3 py-3 font-semibold text-white hover:bg-white/[0.12]"
                  >
                    {user?.username}
                  </Link>
                </>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] px-3 py-3 text-center font-semibold text-violet-100 hover:bg-[rgba(124,58,237,0.24)]"
                >
                  Ingresar
                </Link>
              )}
            </div>
          </nav>
        ) : null}
      </header>
      <div className="flex-1">{children}</div>
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

function mobileNavClass(isActive: boolean) {
  return `rounded-[var(--radius-sm)] px-3 py-3 font-semibold transition ${
    isActive ? 'bg-white/10 text-white' : 'hover:bg-white/[0.06] hover:text-white'
  }`
}
