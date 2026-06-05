import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { useNetworkDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'
import { safeExternalUrl } from '../lib/safeExternalUrl'

export function NetworkDetailsPage() {
  const networkId = Number(useParams().networkId)
  const { data, isError, isLoading } = useNetworkDetails(networkId)

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(networkId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la network" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main className="page-shell">
          <section className="grid gap-6 md:grid-cols-[8rem_1fr]">
            <div className="grid h-28 w-28 place-items-center rounded-[var(--radius-md)] border border-white/10 bg-white/[0.045] p-4 md:h-32 md:w-32">
              {data.logoUrl ? <img src={data.logoUrl} alt="" className="max-h-full max-w-full object-contain" /> : <span className="text-center text-xs text-[var(--color-text-secondary)]">Sin logo</span>}
            </div>
            <div className="min-w-0">
              <p className="kicker">Network</p>
              <h1 className="text-resilient mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
              <p className="text-resilient mt-3 text-sm text-[var(--color-text-secondary)]">
                {[data.originCountry, data.headquarters].filter(Boolean).join(' / ')}
              </p>
              {safeExternalUrl(data.homepage) ? (
                <a href={safeExternalUrl(data.homepage) ?? undefined} target="_blank" rel="noreferrer" className="secondary-action mt-6 inline-flex">
                  Sitio oficial
                </a>
              ) : null}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="surface-panel p-4 sm:p-5">
              <p className="kicker">Catalogo</p>
              <h2 className="mt-2 text-2xl font-semibold">Series populares</h2>
              <div className="mt-6">{data.series.length > 0 ? <MediaGrid items={data.series} /> : <EmptyState title="Sin series" message="TMDB no devolvio series para esta network." />}</div>
            </div>

            {data.alternativeNames.length > 0 ? (
              <aside className="surface-panel p-4 sm:p-5">
                <p className="kicker">Aliases</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {data.alternativeNames.slice(0, 16).map((alias) => (
                    <span key={alias.name} className="max-w-full rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-[var(--color-text-secondary)] text-resilient">
                      {alias.name}
                    </span>
                  ))}
                </div>
              </aside>
            ) : null}
          </section>
        </main>
      ) : null}
    </PublicLayout>
  )
}
