import type { PropsWithChildren } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  ['/admin', 'Dashboard'],
  ['/admin/users', 'Usuarios'],
  ['/admin/reviews', 'Reviews'],
  ['/admin/lists', 'Listas'],
  ['/admin/system-events', 'System'],
  ['/admin/activity-events', 'Activity'],
  ['/admin/audit-logs', 'Auditoria'],
]

export function AdminLayout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-svh bg-[var(--color-background)] text-[var(--color-text-primary)]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-[linear-gradient(180deg,#0b0b10,#09090b)] p-5 lg:block">
        <Link to="/" className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.18em]">
          <span className="h-8 w-1 rounded-full bg-[var(--color-accent)] shadow-[0_0_24px_rgba(124,58,237,0.82)]" />
          <span>Rewndly</span>
        </Link>
        <p className="mt-5 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.03] p-3 text-xs leading-5 text-[var(--color-text-secondary)]">
          Operacion interna, auditoria y moderacion basica de Rewndly.
        </p>
        <nav className="mt-8 grid gap-2 text-sm">
          {links.map(([href, label]) => (
            <NavLink
              key={href}
              to={href}
              end={href === '/admin'}
              className={({ isActive }) =>
                `rounded-[var(--radius-sm)] px-3 py-2 transition ${
                  isActive
                    ? 'bg-[var(--color-accent)] text-white shadow-[0_12px_28px_rgba(124,58,237,0.25)]'
                    : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[rgba(9,9,11,0.9)] px-4 py-3 backdrop-blur-xl lg:hidden">
          <div className="scrollbar-cinema flex gap-2 overflow-x-auto pb-1 text-sm">
            {links.map(([href, label]) => (
              <NavLink
                key={href}
                to={href}
                end={href === '/admin'}
                className={({ isActive }) =>
                  `shrink-0 rounded-[var(--radius-sm)] px-3 py-2 ${
                    isActive ? 'bg-white/10 text-white' : 'text-[var(--color-text-secondary)]'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </header>
        {children}
      </div>
    </div>
  )
}
