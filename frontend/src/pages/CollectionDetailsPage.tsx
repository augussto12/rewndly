import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { DetailHero } from '../components/media/DetailHero/DetailHero'
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
          <DetailHero
            eyebrow="Colección"
            title={data.name}
            poster={{ url: data.posterUrl, alt: data.name }}
            backdropUrl={data.backdropUrl}
            backHref="/discover"
            actions={
              <Link to="/discover" className="secondary-action">
                Explorar más
              </Link>
            }
          >
            {data.overview ? <p className="text-base leading-7 text-[var(--color-text-secondary)]">{data.overview}</p> : null}
          </DetailHero>

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
