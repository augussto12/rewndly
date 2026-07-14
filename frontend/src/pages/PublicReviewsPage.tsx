import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ReviewCard } from '../features/social/components/ReviewCard'
import { usePublicReviewsPages } from '../features/social/hooks/useSocial'
import type { PublicReview } from '../features/social/types/social.types'
import { flattenUniqueArrayPages } from '../lib/pagination'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { PublicLayout } from '../layouts/PublicLayout'

export function PublicReviewsPage() {
  const reviews = usePublicReviewsPages()
  const data = flattenUniqueArrayPages<PublicReview>(reviews.data, (review) => review.id)

  return (
    <PublicLayout ambient="detail">
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold">Reseñas públicas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Lecturas cortas y opiniones visibles para todos.</p>
        </header>
        {reviews.isLoading ? <LoadingSkeleton /> : null}
        {reviews.isError ? <ErrorState /> : null}
        {!reviews.isLoading && !reviews.isError && data.length === 0 ? <EmptyState title="Sin reseñas públicas" message="Todavía no hay reseñas visibles." /> : null}
        <div className="grid gap-4">
          {data.map((review) => <ReviewCard key={review.id} review={review} />)}
        </div>
        <LoadMoreButton
          hasMore={Boolean(reviews.hasNextPage)}
          isLoading={reviews.isFetchingNextPage}
          onClick={() => void reviews.fetchNextPage()}
        />
      </main>
    </PublicLayout>
  )
}

