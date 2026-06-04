import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ReviewCard } from '../features/social/components/ReviewCard'
import { usePublicReviews } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function PublicReviewsPage() {
  const { data, isError, isLoading } = usePublicReviews()

  return (
    <PublicLayout>
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold">Resenas publicas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Lecturas cortas y opiniones visibles para todos.</p>
        </header>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin resenas publicas" message="Todavia no hay resenas visibles." /> : null}
        <div className="grid gap-4">
          {data?.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
      </main>
    </PublicLayout>
  )
}
