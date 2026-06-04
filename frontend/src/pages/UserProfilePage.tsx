import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ProfileHeader } from '../features/social/components/ProfileHeader'
import { ProfileStats } from '../features/social/components/ProfileStats'
import { PublicListCard } from '../features/social/components/PublicListCard'
import { ReviewCard } from '../features/social/components/ReviewCard'
import { useUserLists, useUserProfile, useUserReviews, useUserStats } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function UserProfilePage() {
  const { username } = useParams()
  const profile = useUserProfile(username)
  const stats = useUserStats(username)
  const lists = useUserLists(username)
  const reviews = useUserReviews(username)

  return (
    <PublicLayout>
      {profile.isLoading ? (
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <LoadingSkeleton />
        </main>
      ) : null}
      {profile.isError ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="Perfil no disponible" message="No existe o no tenes permiso para verlo." />
        </main>
      ) : null}
      {profile.data ? (
        <>
          <ProfileHeader profile={profile.data} />
          <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
            {stats.data ? <ProfileStats stats={stats.data} /> : null}
            <section>
              <h2 className="mb-4 text-2xl font-semibold">Listas visibles</h2>
              {lists.data?.length === 0 ? <EmptyState title="Sin listas visibles" message="No hay listas para mostrar." /> : null}
              <div className="grid gap-4 md:grid-cols-2">
                {lists.data?.map((list) => <PublicListCard key={list.id} list={list} />)}
              </div>
            </section>
            <section>
              <h2 className="mb-4 text-2xl font-semibold">Reseñas visibles</h2>
              {reviews.data?.length === 0 ? <EmptyState title="Sin reseñas visibles" message="No hay reseñas para mostrar." /> : null}
              <div className="grid gap-4">
                {reviews.data?.map((review) => <ReviewCard key={review.id} review={review} />)}
              </div>
            </section>
          </main>
        </>
      ) : null}
    </PublicLayout>
  )
}
