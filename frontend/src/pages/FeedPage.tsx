import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ActivityCard } from '../features/social/components/ActivityCard'
import { useFeedPages } from '../features/social/hooks/useSocial'
import type { ActivityEvent } from '../features/social/types/social.types'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function FeedPage() {
  const feed = useFeedPages()
  const items = flattenUniquePages<ActivityEvent>(feed.data, (activity) => activity.id)

  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Feed</p>
          <h1 className="mt-3 text-4xl font-semibold">Actividad reciente</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Un pulso simple de lo que tus amigos estan viendo, puntuando y guardando.</p>
        </header>
        {feed.isLoading ? <LoadingSkeleton /> : null}
        {feed.isError ? <ErrorState /> : null}
        {!feed.isLoading && !feed.isError && items.length === 0 ? <EmptyState title="Feed vacio" message="Cuando tus amigos interactuen con contenido, aparecera aca." /> : null}
        <div className="grid gap-4">
          {items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
        <LoadMoreButton
          hasMore={Boolean(feed.hasNextPage)}
          isLoading={feed.isFetchingNextPage}
          onClick={() => void feed.fetchNextPage()}
        />
      </main>
    </PublicLayout>
  )
}

function LoadMoreButton({ hasMore, isLoading, onClick }: { hasMore: boolean; isLoading: boolean; onClick: () => void }) {
  if (!hasMore) {
    return null
  }

  return (
    <div className="mt-8 flex justify-center">
      <button type="button" onClick={onClick} disabled={isLoading} className="secondary-action">
        {isLoading ? 'Cargando...' : 'Mostrar mas'}
      </button>
    </div>
  )
}
