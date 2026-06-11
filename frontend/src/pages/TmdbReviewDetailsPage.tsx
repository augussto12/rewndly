import { Link, useParams } from 'react-router-dom'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useTmdbReviewDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'
import { safeExternalUrl } from '../lib/safeExternalUrl'

export function TmdbReviewDetailsPage() {
  const reviewId = useParams().reviewId
  const { data, isError, isLoading } = useTmdbReviewDetails(reviewId)

  return (
    <PublicLayout ambient="detail">
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !reviewId ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la review" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main className="page-shell">
          <article className="surface-panel mx-auto max-w-4xl p-5 sm:p-7">
            <p className="kicker">Review TMDB</p>
            <div className="mt-5 flex items-center gap-4">
              {data.avatarUrl ? <img src={data.avatarUrl} alt="" className="h-14 w-14 rounded-full object-cover" /> : null}
              <div className="min-w-0">
                <h1 className="text-resilient text-3xl font-semibold leading-tight">{data.author}</h1>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                  {[data.username ? `@${data.username}` : '', data.rating ? `${data.rating}/10` : '', data.createdAt ? data.createdAt.slice(0, 10) : '']
                    .filter(Boolean)
                    .join(' / ')}
                </p>
              </div>
            </div>
            <div className="text-resilient mt-7 whitespace-pre-line text-base leading-8 text-[var(--color-text-secondary)]">{data.content}</div>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/discover" className="secondary-action">
                Explorar catálogo
              </Link>
              {safeExternalUrl(data.url) ? (
                <a href={safeExternalUrl(data.url) ?? undefined} target="_blank" rel="noreferrer" className="secondary-action">
                  Ver en TMDB
                </a>
              ) : null}
            </div>
          </article>
        </main>
      ) : null}
    </PublicLayout>
  )
}
