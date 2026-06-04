import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { PublicListCard } from '../features/social/components/PublicListCard'
import { usePublicLists } from '../features/social/hooks/useSocial'
import { PublicLayout } from '../layouts/PublicLayout'

export function PublicListsPage() {
  const { data, isError, isLoading } = usePublicLists()

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold">Listas publicas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Colecciones compartidas por la comunidad, con privacidad visible y lectura comoda.</p>
        </header>
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? <EmptyState title="Sin listas publicas" message="Todavia no hay listas visibles." /> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data?.map((list) => <PublicListCard key={list.id} list={list} />)}
        </div>
      </main>
    </PublicLayout>
  )
}
