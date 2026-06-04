import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useDeleteReview, useMyReviews } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'

export function MyReviewsPage() {
  const { data, isError, isLoading } = useMyReviews()
  const deleteReview = useDeleteReview()

  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Resenas</p>
          <h1 className="mt-3 text-4xl font-semibold">Mis resenas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Textos independientes de tu biblioteca personal.</p>
        </header>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState title="Sin resenas" message="Crea una resena desde el detalle de una pelicula o serie." />
        ) : null}
        <div className="grid gap-4">
          {data?.map((review) => (
            <article key={review.id} className="surface-panel p-5">
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-secondary)]">
                <span>{review.mediaTitle}</span>
                <span>{review.visibility}</span>
                {review.ratingSnapshot ? <span>{review.ratingSnapshot}/10</span> : null}
              </div>
              <h2 className="mt-3 text-xl font-semibold">{review.title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">{review.body}</p>
              <button onClick={() => void deleteReview.mutateAsync(review.id)} className="secondary-action mt-4">
                Eliminar
              </button>
            </article>
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}
