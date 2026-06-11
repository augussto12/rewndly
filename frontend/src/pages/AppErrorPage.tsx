import { Link, isRouteErrorResponse, useRouteError } from 'react-router-dom'
import { useAuth } from '../features/auth/useAuth'
import { PublicLayout } from '../layouts/PublicLayout'

type AppErrorPageProps = {
  mode?: 'not-found' | 'runtime'
}

export function AppErrorPage({ mode }: AppErrorPageProps) {
  const routeError = useRouteError()
  const { isAuthenticated } = useAuth()
  const isNotFound = mode === 'not-found' || (isRouteErrorResponse(routeError) && routeError.status === 404)
  const title = isNotFound ? 'Esta función no está en cartelera' : 'Algo salió mal en la sala'
  const message = isNotFound
    ? 'Puede que el link haya cambiado, que la página ya no exista o que hayas llegado a una función que todavía no estrenamos.'
    : 'La página se trabó antes de cargar bien. Podés recargarla o volver al inicio y seguir explorando.'

  return (
    <PublicLayout ambient="error">
      <main className="page-shell grid min-h-[calc(100svh-9rem)] place-items-center">
        <section className="relative w-full max-w-4xl overflow-hidden rounded-[var(--radius-md)] border border-violet-200/18 bg-[rgba(18,20,36,0.86)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />
          <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto grid aspect-square w-52 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/28 sm:w-60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(45,212,191,0.22),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(251,113,133,0.18),transparent_38%)]" />
              <ErrorFilmIllustration />
            </div>
            <div className="text-center lg:text-left">
              <p className="kicker">{isNotFound ? '404' : 'Error'}</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">{title}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">{message}</p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                {isNotFound ? (
                  <>
                    <Link to="/" className="primary-action">Volver al inicio</Link>
                    <Link to="/movies/search" className="secondary-action">Explorar películas</Link>
                    {isAuthenticated ? <Link to="/me/library" className="secondary-action">Ir a mi biblioteca</Link> : null}
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => window.location.reload()} className="primary-action">Recargar</button>
                    <Link to="/" className="secondary-action">Volver al inicio</Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </PublicLayout>
  )
}

export function ErrorFilmIllustration() {
  return (
    <svg className="relative z-10 h-36 w-36 text-violet-100 sm:h-40 sm:w-40" viewBox="0 0 160 160" fill="none" aria-hidden="true">
      <rect x="30" y="42" width="100" height="76" rx="10" fill="rgba(124,58,237,0.22)" stroke="currentColor" strokeWidth="3" />
      <path d="M42 42v76M118 42v76" stroke="currentColor" strokeWidth="3" opacity="0.72" />
      <path d="M30 67h100M30 93h100" stroke="currentColor" strokeWidth="3" opacity="0.5" />
      {[
        [42, 54], [42, 80], [42, 106],
        [118, 54], [118, 80], [118, 106],
      ].map(([cx, cy]) => (
        <rect key={`${cx}-${cy}`} x={cx - 4} y={cy - 4} width="8" height="8" rx="2" fill="currentColor" opacity="0.84" />
      ))}
      <path d="M55 104 108 51" stroke="rgba(251,113,133,0.92)" strokeWidth="7" strokeLinecap="round" />
      <path d="M58 51 111 104" stroke="rgba(45,212,191,0.82)" strokeWidth="7" strokeLinecap="round" />
      <circle cx="80" cy="80" r="58" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
    </svg>
  )
}
