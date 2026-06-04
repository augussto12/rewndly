import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { ActivityCard } from '../features/social/components/ActivityCard'
import { useFeed } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function FeedPage() {
  const { data, isError, isLoading } = useFeed()

  return (
    <PublicLayout>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <header className="mb-8">
          <p className="kicker">Feed</p>
          <h1 className="mt-3 text-4xl font-semibold">Actividad reciente</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Un pulso simple de lo que tus amigos estan viendo, puntuando y guardando.</p>
        </header>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.items.length === 0 ? <EmptyState title="Feed vacio" message="Cuando tus amigos interactuen con contenido, aparecera aca." /> : null}
        <div className="grid gap-4">
          {data?.items.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}
