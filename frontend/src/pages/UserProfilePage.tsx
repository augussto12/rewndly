import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ProfileHeader } from '../features/social/components/ProfileHeader'
import { ProfileStats } from '../features/social/components/ProfileStats'
import { PublicListCard } from '../features/social/components/PublicListCard'
import { ReviewCard } from '../features/social/components/ReviewCard'
import { useUserListsPages, useUserProfile, useUserReviewsPages, useUserStats } from '../features/social/hooks/useSocial'
import type { PublicList, PublicReview } from '../features/social/types/social.types'
import { flattenUniqueArrayPages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function UserProfilePage() {
  const { username } = useParams()
  const profile = useUserProfile(username)
  const stats = useUserStats(username)
  const lists = useUserListsPages(username)
  const reviews = useUserReviewsPages(username)
  const visibleLists = flattenUniqueArrayPages<PublicList>(lists.data, (list) => list.id)
  const visibleReviews = flattenUniqueArrayPages<PublicReview>(reviews.data, (review) => review.id)

  return (
    <PublicLayout>
      {profile.isLoading ? (
        <main className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
          <LoadingSkeleton />
        </main>
      ) : null}
      {profile.isError ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="Perfil no disponible" message="No existe o no tenés permiso para verlo." />
        </main>
      ) : null}
      {profile.data ? (
        <>
          <ProfileHeader profile={profile.data} />
          <main className="mx-auto max-w-[90rem] space-y-8 px-4 py-8 sm:px-6">
            {stats.data ? <ProfileStats stats={stats.data} /> : null}
            <section>
              <h2 className="mb-4 text-2xl font-semibold">Listas visibles</h2>
              {lists.isLoading ? <LoadingSkeleton /> : null}
              {!lists.isLoading && visibleLists.length === 0 ? <EmptyState title="Sin listas visibles" message="No hay listas para mostrar." /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {visibleLists.map((list) => <PublicListCard key={list.id} list={list} />)}
              </div>
              <LoadMoreButton
                hasMore={Boolean(lists.hasNextPage)}
                isLoading={lists.isFetchingNextPage}
                onClick={() => void lists.fetchNextPage()}
              />
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-semibold">Reseñas visibles</h2>
              {reviews.isLoading ? <LoadingSkeleton /> : null}
              {!reviews.isLoading && visibleReviews.length === 0 ? (
                <EmptyState title="Sin reseñas visibles" message="No hay reseñas para mostrar." />
              ) : null}
              <div className="grid gap-4">
                {visibleReviews.map((review) => <ReviewCard key={review.id} review={review} />)}
              </div>
              <LoadMoreButton
                hasMore={Boolean(reviews.hasNextPage)}
                isLoading={reviews.isFetchingNextPage}
                onClick={() => void reviews.fetchNextPage()}
              />
            </section>
          </main>
        </>
      ) : null}
    </PublicLayout>
  )
}

function LoadMoreButton({ hasMore, isLoading, onClick }: { hasMore: boolean; isLoading: boolean; onClick: () => void }) {
  if (!hasMore) {
    return null
  }

  return (
    <div className="mt-6 flex justify-center">
      <button type="button" onClick={onClick} disabled={isLoading} className="secondary-action">
        {isLoading ? 'Cargando...' : 'Mostrar más'}
      </button>
    </div>
  )
}
