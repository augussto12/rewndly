import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import {
  useConnectTmdbAccount,
  useDisconnectTmdbAccount,
  useSyncTmdbLibrary,
  useTmdbConnectionStatus,
  useTmdbRemoteLibrary,
} from '../features/user-content/hooks/useTmdbAccount'
import { PublicLayout } from '../layouts/PublicLayout'

const pendingTokenKey = 'rewndly.tmdb.requestToken'

export function TmdbAccountPage() {
  const status = useTmdbConnectionStatus()
  const connect = useConnectTmdbAccount()
  const disconnect = useDisconnectTmdbAccount()
  const sync = useSyncTmdbLibrary()
  const remoteLibrary = useTmdbRemoteLibrary(Boolean(status.data?.isConnected))

  async function startConnection() {
    const response = await connect.mutateAsync()
    sessionStorage.setItem(pendingTokenKey, response.requestToken)
    window.location.href = response.authorizationUrl
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header>
          <p className="kicker">TMDB</p>
          <h1 className="mt-3 text-4xl font-semibold">Cuenta TMDB</h1>
          <p className="mt-3 max-w-3xl text-[var(--color-text-secondary)]">
            Conecta tu cuenta de TMDB para sincronizar favoritos, watchlist y ratings. La sesion queda guardada en el backend, no en el navegador.
          </p>
        </header>

        {status.isLoading ? <LoadingSkeleton /> : null}
        {status.isError ? <ErrorState title="No pudimos cargar la conexion TMDB" /> : null}

        {!status.isLoading && !status.isError && status.data ? (
          <section className="surface-panel p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="kicker">Estado</p>
                <h2 className="mt-2 text-2xl font-semibold">
                  {status.data.isConnected ? `Conectada como @${status.data.username}` : 'No conectada'}
                </h2>
                {status.data.isConnected ? (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    {[status.data.displayName, status.data.lastSyncedAt ? `Ultima sync ${status.data.lastSyncedAt.slice(0, 10)}` : 'Sin sync todavia']
                      .filter(Boolean)
                      .join(' / ')}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    Te vamos a llevar a TMDB para aprobar el acceso y despues vas a volver a Rewndly.
                  </p>
                )}
              </div>

              <div className="flex flex-wrap gap-3">
                {status.data.isConnected ? (
                  <>
                    <button onClick={() => void sync.mutateAsync()} disabled={sync.isPending} className="primary-action">
                      Sincronizar
                    </button>
                    <button onClick={() => void disconnect.mutateAsync()} disabled={disconnect.isPending} className="secondary-action">
                      Desconectar
                    </button>
                  </>
                ) : (
                  <button onClick={() => void startConnection()} disabled={connect.isPending} className="primary-action">
                    Conectar con TMDB
                  </button>
                )}
              </div>
            </div>

            {sync.data ? (
              <p className="mt-5 rounded-[var(--radius-sm)] border border-emerald-300/20 bg-emerald-400/10 p-3 text-sm text-emerald-100">
                Sync completa: {sync.data.imported} importados, {sync.data.updated} actualizados.
              </p>
            ) : null}
          </section>
        ) : null}

        {status.data?.isConnected ? (
          <section className="space-y-8">
            {remoteLibrary.isLoading ? <LoadingSkeleton /> : null}
            {remoteLibrary.isError ? <ErrorState title="No pudimos cargar tu biblioteca TMDB" /> : null}
            {remoteLibrary.data ? (
              <>
                <RemoteSection title="Favoritos TMDB" items={[...remoteLibrary.data.favoriteMovies, ...remoteLibrary.data.favoriteSeries]} />
                <RemoteSection title="Watchlist TMDB" items={[...remoteLibrary.data.watchlistMovies, ...remoteLibrary.data.watchlistSeries]} />
                <RemoteSection title="Ratings TMDB" items={[...remoteLibrary.data.ratedMovies, ...remoteLibrary.data.ratedSeries]} />
              </>
            ) : null}
          </section>
        ) : (
          <section className="surface-panel p-5">
            <EmptyState title="TMDB sin conectar" message="Cuando conectes tu cuenta, aca vas a ver favoritos, watchlist y ratings remotos." />
          </section>
        )}

        <Link to="/me" className="secondary-action w-fit">
          Volver a mi cuenta
        </Link>
      </main>
    </PublicLayout>
  )
}

function RemoteSection({ title, items }: { title: string; items: Parameters<typeof MediaGrid>[0]['items'] }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section>
      <p className="kicker">TMDB</p>
      <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
      <div className="mt-6">
        <MediaGrid items={items} />
      </div>
    </section>
  )
}
