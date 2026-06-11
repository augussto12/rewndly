import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { useCollectionDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function CollectionDetailsPage() {
  const collectionId = Number(useParams().collectionId)
  const { data, isError, isLoading } = useCollectionDetails(collectionId)

  return (
    <PublicLayout ambient="detail">
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(collectionId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la colección" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main>
          <section className="relative overflow-hidden">
            {data.backdropUrl ? <img src={data.backdropUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" /> : null}
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-[var(--color-bg)]/78 to-[var(--color-bg)]" />
            <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[14rem_1fr] md:py-16">
              <div className="w-44 md:w-full">
                <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/[0.12] bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)]">
                  {data.posterUrl ? <img src={data.posterUrl} alt={data.name} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-sm text-[var(--color-text-secondary)]">Sin póster</div>}
                </div>
              </div>
              <div className="self-end">
                <p className="kicker">Colección</p>
                <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
                {data.overview ? <p className="mt-6 max-w-3xl text-base leading-7 text-[var(--color-text-secondary)]">{data.overview}</p> : null}
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/discover" className="secondary-action">
                    Explorar más
                  </Link>
                </div>
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
            <p className="kicker">Partes</p>
            <h2 className="mt-2 text-2xl font-semibold">Películas de la saga</h2>
            <div className="mt-6">
              {data.parts.length > 0 ? <MediaGrid items={data.parts} /> : <EmptyState title="Sin partes disponibles" message="TMDB no devolvió películas para esta colección." />}
            </div>
          </section>
        </main>
      ) : null}
    </PublicLayout>
  )
}
