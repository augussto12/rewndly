import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { PublicListCard } from '../features/social/components/PublicListCard'
import { usePublicListsPages } from '../features/social/hooks/useSocial'
import type { PublicList } from '../features/social/types/social.types'
import { flattenUniqueArrayPages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function PublicListsPage() {
  const lists = usePublicListsPages()
  const data = flattenUniqueArrayPages<PublicList>(lists.data, (list) => list.id)

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="mb-8">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold">Listas publicas</h1>
          <p className="mt-3 text-[var(--color-text-secondary)]">Colecciones compartidas por la comunidad, con privacidad visible y lectura comoda.</p>
        </header>
        {lists.isLoading ? <LoadingSkeleton /> : null}
        {lists.isError ? <ErrorState /> : null}
        {!lists.isLoading && !lists.isError && data.length === 0 ? <EmptyState title="Sin listas publicas" message="Todavia no hay listas visibles." /> : null}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((list) => <PublicListCard key={list.id} list={list} />)}
        </div>
        <LoadMoreButton
          hasMore={Boolean(lists.hasNextPage)}
          isLoading={lists.isFetchingNextPage}
          onClick={() => void lists.fetchNextPage()}
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
