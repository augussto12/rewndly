import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useCompleteTmdbConnection } from '../features/user-content/hooks/useTmdbAccount'
import { PublicLayout } from '../layouts/PublicLayout'
import { getErrorMessage } from '../services/apiError'

const pendingTokenKey = 'rewndly.tmdb.requestToken'

export function TmdbCallbackPage() {
  const [searchParams] = useSearchParams()
  const complete = useCompleteTmdbConnection()
  const approved = searchParams.get('approved')
  const denied = approved === 'false'
  const requestToken = useMemo(
    () => searchParams.get('request_token') ?? sessionStorage.getItem(pendingTokenKey) ?? '',
    [searchParams],
  )

  useEffect(() => {
    if (!requestToken || denied || complete.isPending || complete.isSuccess || complete.isError) {
      return
    }

    void complete
      .mutateAsync(requestToken)
      .then(() => {
        sessionStorage.removeItem(pendingTokenKey)
      })
      .catch(() => undefined)
  }, [complete, denied, requestToken])

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        {complete.isPending || (!complete.isSuccess && !complete.isError && !denied) ? (
          <section>
            <p className="kicker">TMDB</p>
            <h1 className="mt-3 text-4xl font-semibold">Conectando cuenta</h1>
            <div className="mt-8">
              <LoadingSkeleton />
            </div>
          </section>
        ) : null}

        {denied ? (
          <ErrorState title="Permiso cancelado" message="TMDB no aprobó el token. Podés intentar conectar de nuevo cuando quieras." />
        ) : null}

        {!requestToken && !denied ? (
          <ErrorState title="Falta el token de TMDB" message="Volvé a iniciar la conexión desde Rewndly para generar un token nuevo." />
        ) : null}

        {complete.isError ? (
          <ErrorState
            title="No pudimos completar la conexión"
            message={getErrorMessage(complete.error, 'El token puede haber expirado o TMDB no pudo crear la sesión.')}
          />
        ) : null}

        {complete.isSuccess ? (
          <section className="surface-panel p-6">
            <p className="kicker">TMDB</p>
            <h1 className="mt-3 text-3xl font-semibold">Cuenta conectada</h1>
            <p className="mt-3 text-[var(--color-text-secondary)]">Ya podés sincronizar favoritos, watchlist y ratings con Rewndly.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/me/tmdb" className="primary-action">
                Ir a cuenta TMDB
              </Link>
              <Link to="/me" className="secondary-action">
                Mi cuenta
              </Link>
            </div>
          </section>
        ) : null}
      </main>
    </PublicLayout>
  )
}
