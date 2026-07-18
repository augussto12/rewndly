import { useState, useRef, useEffect, type PropsWithChildren, type SVGProps } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { GlobalSearch } from '../components/search/GlobalSearch/GlobalSearch'
import { BackToTop } from '../components/ui/BackToTop'
import { UserAvatar } from '../components/user/UserAvatar'
import { useAuth } from '../features/auth/useAuth'

// ─── Inline SVG icons ────────────────────────────────────────────────────────

function IconBook(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  )
}

function IconListMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" />
      <line x1="8" y1="18" x2="21" y2="18" /><line x1="3" y1="6" x2="3.01" y2="6" />
      <line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}

function IconStar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}

function IconNewspaper(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" /><path d="M15 18h-5" /><path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

function IconUser(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

function IconLogOut(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function IconFilm(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="2" />
      <line x1="7" y1="2" x2="7" y2="22" /><line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" /><line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" /><line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  )
}

function IconTv(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="7" width="20" height="15" rx="2" />
      <polyline points="17 2 12 7 7 2" />
    </svg>
  )
}

function IconNews(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M4 22h16a2 2 0 0 0 2-2V4a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v16a2 2 0 0 1-2 2 2 2 0 0 1-2-2V7" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  )
}

function IconCalendar(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function IconCompass(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  )
}

function IconScales(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="12" y1="3" x2="12" y2="21" />
      <path d="M3 6l9 3 9-3" />
      <path d="M5 10l-2 5c.83 1 2.17 2 3.5 2s2.67-1 3.5-2L5 10z" />
      <path d="M19 10l-2 5c.83 1 2.17 2 3.5 2s2.67-1 3.5-2L19 10z" />
    </svg>
  )
}

function IconGamepad(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="6" y1="12" x2="10" y2="12" /><line x1="8" y1="10" x2="8" y2="14" />
      <line x1="15" y1="13" x2="15.01" y2="13" /><line x1="18" y1="11" x2="18.01" y2="11" />
      <rect x="2" y="6" width="20" height="12" rx="2" />
    </svg>
  )
}

function IconChevronDown(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function IconMenu(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}

function IconX(props: SVGProps<SVGSVGElement>) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  )
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const publicLinks = [
  { href: '/movies/search', label: 'Películas', icon: IconFilm },
  { href: '/series/search', label: 'Series', icon: IconTv },
  { href: '/discover', label: 'Explorar', icon: IconCompass },
  { href: '/calendario', label: 'Calendario', icon: IconCalendar },
  { href: '/noticias', label: 'Noticias', icon: IconNews },
  { href: '/compare', label: 'Comparar', icon: IconScales },
  { href: '/games/poster', label: 'Juego', icon: IconGamepad },
  { href: '/lists/public', label: 'Listas', icon: IconListMenu },
]

// ─── Class helpers ────────────────────────────────────────────────────────────

function desktopNavClass({ isActive }: { isActive: boolean }) {
  return `shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition hover:bg-white/[0.06] hover:text-white ${
    isActive
      ? 'bg-[rgba(124,58,237,0.13)] text-violet-300'
      : 'text-[var(--color-text-secondary)]'
  }`
}

function dropdownNavClass({ isActive }: { isActive: boolean }) {
  return `flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm transition ${
    isActive
      ? 'bg-[rgba(124,58,237,0.13)] text-violet-300'
      : 'text-[var(--color-text-secondary)] hover:bg-white/[0.05] hover:text-white'
  }`
}

function sidebarNavClass({ isActive }: { isActive: boolean }) {
  return `flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm transition ${
    isActive
      ? 'bg-[rgba(124,58,237,0.13)] text-violet-300'
      : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
  }`
}

// ─── Component ────────────────────────────────────────────────────────────────

type PublicLayoutAmbient = 'default' | 'home' | 'catalog' | 'detail' | 'game' | 'error'

type PublicLayoutProps = PropsWithChildren<{
  ambient?: PublicLayoutAmbient
}>

export function PublicLayout({ children, ambient = 'default' }: PublicLayoutProps) {
  const { isAuthenticated, user, logout } = useAuth()
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const avatarMenuRef = useRef<HTMLDivElement>(null)
  const sidebarCloseRef = useRef<HTMLButtonElement>(null)

  const isAdmin = user?.role === 'Admin'

  // Close dropdown on outside click
  useEffect(() => {
    if (!isAvatarMenuOpen) return
    function handleClick(e: MouseEvent) {
      if (avatarMenuRef.current && !avatarMenuRef.current.contains(e.target as Node)) {
        setIsAvatarMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [isAvatarMenuOpen])

  // Escape key closes both menus
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsAvatarMenuOpen(false)
        setIsSidebarOpen(false)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  // Lock body scroll and move focus into the drawer when the sidebar opens
  useEffect(() => {
    document.body.style.overflow = isSidebarOpen ? 'hidden' : ''
    if (isSidebarOpen) {
      sidebarCloseRef.current?.focus()
    }
    return () => { document.body.style.overflow = '' }
  }, [isSidebarOpen])

  const closeSidebar = () => setIsSidebarOpen(false)
  const closeDropdown = () => setIsAvatarMenuOpen(false)

  const ambientClass = ambient === 'default' ? '' : ` cinema-page--${ambient}`

  return (
    <div className={`cinema-page${ambientClass} flex min-h-svh flex-col text-[var(--color-text-primary)]`}>

      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="site-header sticky top-0 z-20">
        <div className="mx-auto flex max-w-[90rem] items-center gap-4 px-4 py-3 sm:px-6">

          {/* Logo */}
          <Link
            to="/"
            onClick={closeSidebar}
            className="flex shrink-0 items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em]"
          >
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-play" />
            </span>
            <span>Rewndly</span>
          </Link>

          {/* ── Desktop center nav ── */}
          <nav
            aria-label="Navegación principal"
            className="hidden flex-1 items-center justify-center gap-0.5 lg:flex"
          >
            {publicLinks.map(({ href, label }) => (
              <NavLink key={href} to={href} className={desktopNavClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop right: search + avatar ── */}
          <div className="hidden items-center gap-2 lg:flex">
            <GlobalSearch />

            {isAuthenticated ? (
              <div className="relative" ref={avatarMenuRef}>
                {/* Avatar trigger button */}
                <button
                  type="button"
                  onClick={() => setIsAvatarMenuOpen((v) => !v)}
                  aria-expanded={isAvatarMenuOpen}
                  aria-haspopup="menu"
                  aria-label="Menú de usuario"
                  className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-white/[0.06] hover:text-white"
                >
                  <UserAvatar displayName={user?.displayName} username={user?.username} />
                  <span className="max-w-[7rem] truncate">{user?.username}</span>
                  <IconChevronDown
                    className={`shrink-0 opacity-60 transition-transform duration-200 ${isAvatarMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown menu */}
                <div
                  inert={!isAvatarMenuOpen}
                  className={`nav-dropdown ${isAvatarMenuOpen ? 'nav-dropdown--open' : ''}`}
                >
                  {/* User header */}
                  <div className="flex items-center gap-3 px-3.5 pb-3 pt-3.5">
                    <UserAvatar displayName={user?.displayName} username={user?.username} size="lg" className="shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-white">
                        {user?.displayName || user?.username}
                      </p>
                      <p className="truncate text-xs text-[var(--color-text-secondary)]">
                        @{user?.username}
                      </p>
                    </div>
                  </div>
                  <div className="nav-divider" />

                  {/* Personal */}
                  <div className="space-y-0.5 p-1.5">
                    <NavLink to="/me/library" onClick={closeDropdown} role="menuitem" className={dropdownNavClass}>
                      <IconBook /> Mi biblioteca
                    </NavLink>
                    <NavLink to="/me/lists" onClick={closeDropdown} role="menuitem" className={dropdownNavClass}>
                      <IconListMenu /> Mis listas
                    </NavLink>
                    <NavLink to="/me/reviews" onClick={closeDropdown} role="menuitem" className={dropdownNavClass}>
                      <IconStar /> Mis reseñas
                    </NavLink>
                  </div>

                  {/* Admin */}
                  {isAdmin && (
                    <>
                      <div className="nav-divider" />
                      <div className="space-y-0.5 p-1.5">
                        <div className="flex items-center gap-2 px-2.5 pb-0.5 pt-1">
                          <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)]">
                            Admin
                          </span>
                          <span className="admin-pill">Solo vos</span>
                        </div>
                        <NavLink to="/feed" onClick={closeDropdown} role="menuitem" className={dropdownNavClass}>
                          <IconNewspaper /> Feed
                        </NavLink>
                      </div>
                    </>
                  )}

                  <div className="nav-divider" />
                  <div className="space-y-0.5 p-1.5">
                    <NavLink to="/me" onClick={closeDropdown} role="menuitem" className={dropdownNavClass}>
                      <IconUser /> Cuenta
                    </NavLink>
                    <button
                      type="button"
                                           onClick={() => { closeDropdown(); logout() }}
                      className="flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-2.5 py-2 text-sm text-[#f87171] transition hover:bg-white/[0.05]"
                    >
                      <IconLogOut /> Cerrar sesión
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className="rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] px-3 py-2 text-sm text-violet-100 transition hover:bg-[rgba(124,58,237,0.24)]"
              >
                Ingresar
              </Link>
            )}
          </div>

          {/* ── Mobile right ── */}
          <div className="ml-auto flex shrink-0 items-center gap-2 lg:hidden">
            <GlobalSearch onNavigate={closeSidebar} />

            {isAuthenticated ? (
              /* Avatar button — shows name on sm+, only avatar on xs */
              <button
                type="button"
                aria-label="Abrir menú"
                aria-expanded={isSidebarOpen}
                aria-haspopup="menu"
                aria-controls="mobile-sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5 text-sm text-[var(--color-text-secondary)] transition hover:bg-white/[0.06] hover:text-white"
              >
                <span className="hidden max-w-[6rem] truncate sm:block">{user?.username}</span>
                <UserAvatar displayName={user?.displayName} username={user?.username} />
                <IconChevronDown className="shrink-0 opacity-60" />
              </button>
            ) : (
              /* Hamburger for guests */
              <button
                type="button"
                aria-label="Abrir menú"
                aria-expanded={isSidebarOpen}
                aria-haspopup="menu"
                aria-controls="mobile-sidebar"
                onClick={() => setIsSidebarOpen(true)}
                className="inline-grid h-9 w-9 place-items-center rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.06] text-[var(--color-text-secondary)] transition hover:bg-white/[0.1] hover:text-white"
              >
                <IconMenu />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ═══════════════════ SIDEBAR OVERLAY ═══════════════════ */}
      <div
        aria-hidden="true"
        onClick={closeSidebar}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          isSidebarOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* ═══════════════════ SIDEBAR DRAWER ═══════════════════ */}
      <aside
        id="mobile-sidebar"
        aria-label="Menú lateral"
        inert={!isSidebarOpen}
        className={`fixed inset-y-0 right-0 z-50 flex w-72 flex-col border-l border-white/[0.09] bg-[rgba(13,15,28,0.98)] shadow-2xl backdrop-blur-xl transition-transform duration-300 ease-out lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Drawer top bar */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3.5">
          <Link
            to="/"
            onClick={closeSidebar}
            className="flex items-center gap-2.5 text-sm font-semibold uppercase tracking-[0.18em]"
          >
            <span className="brand-mark" aria-hidden="true">
              <span className="brand-mark-play" />
            </span>
            <span>Rewndly</span>
          </Link>
          <button
            ref={sidebarCloseRef}
            type="button"
            aria-label="Cerrar menú"
            onClick={closeSidebar}
            className="inline-grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] text-[var(--color-text-secondary)] transition hover:bg-white/[0.07] hover:text-white"
          >
            <IconX />
          </button>
        </div>

        {/* Drawer body */}
        <div className="flex-1 overflow-y-auto px-3 py-5">

          {/* User info */}
          {isAuthenticated && user && (
            <div className="mb-6 flex items-center gap-3 px-1">
              <UserAvatar displayName={user?.displayName} username={user?.username} size="lg" className="shrink-0" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {user.displayName || user.username}
                </p>
                <p className="truncate text-xs text-[var(--color-text-secondary)]">
                  @{user.username}
                </p>
              </div>
            </div>
          )}

          <div className="space-y-5">

            {/* MI REWNDLY */}
            {isAuthenticated && (
              <section>
                <p className="sidebar-group-label">Mi Rewndly</p>
                <div className="space-y-0.5">
                  <NavLink to="/me/library" onClick={closeSidebar} className={sidebarNavClass}>
                    <IconBook /><span>Mi biblioteca</span>
                  </NavLink>
                  <NavLink to="/me/lists" onClick={closeSidebar} className={sidebarNavClass}>
                    <IconListMenu /><span>Mis listas</span>
                  </NavLink>
                  <NavLink to="/me/reviews" onClick={closeSidebar} className={sidebarNavClass}>
                    <IconStar /><span>Mis reseñas</span>
                  </NavLink>
                </div>
              </section>
            )}

            {/* DESCUBRIR */}
            <section>
              <p className="sidebar-group-label">Descubrir</p>
              <div className="space-y-0.5">
                {publicLinks.map(({ href, label, icon: Icon }) => (
                  <NavLink key={href} to={href} onClick={closeSidebar} className={sidebarNavClass}>
                    <Icon /><span>{label}</span>
                  </NavLink>
                ))}
              </div>
            </section>

            {/* ADMIN */}
            {isAuthenticated && isAdmin && (
              <section>
                <div className="mb-1 flex items-center gap-2 px-3">
                  <span className="text-[0.6rem] font-semibold uppercase tracking-widest text-[var(--color-text-secondary)] opacity-65">
                    Admin
                  </span>
                  <span className="admin-pill">Solo vos</span>
                </div>
                <NavLink to="/feed" onClick={closeSidebar} className={sidebarNavClass}>
                  <IconNewspaper /><span>Feed</span>
                </NavLink>
              </section>
            )}
          </div>
        </div>

        {/* Drawer footer */}
        <div className="space-y-0.5 border-t border-white/[0.08] px-3 py-3">
          {isAuthenticated ? (
            <>
              <NavLink to="/me" onClick={closeSidebar} className={sidebarNavClass}>
                <IconUser /><span>Cuenta</span>
              </NavLink>
              <button
                type="button"
                onClick={() => { closeSidebar(); logout() }}
                className="flex w-full items-center gap-3 rounded-[var(--radius-sm)] px-3 py-2.5 text-sm text-[#f87171] transition hover:bg-white/[0.04]"
              >
                <IconLogOut /><span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              onClick={closeSidebar}
              className="block rounded-[var(--radius-sm)] bg-[var(--color-accent-soft)] px-3 py-2.5 text-center text-sm font-medium text-violet-100 transition hover:bg-[rgba(124,58,237,0.24)]"
            >
              Ingresar
            </Link>
          )}
        </div>
      </aside>

      {/* ═══════════════════ PAGE CONTENT ═══════════════════ */}
      <div className="flex-1">{children}</div>

      <BackToTop />

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-white/10 bg-black/20">
        <div className="mx-auto flex max-w-[90rem] flex-col gap-2 px-4 py-6 text-xs text-[var(--color-text-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <span>Rewndly</span>
          <span>
            Datos e imágenes provistos por{' '}
            <a
              className="text-violet-200 underline-offset-4 hover:underline"
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noreferrer"
            >
              TMDB
            </a>
            . Rewndly no está afiliado ni respaldado por TMDB.
          </span>
        </div>
      </footer>
    </div>
  )
}
