import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { VisibilityBadge } from '../features/social/components/VisibilityBadge'
import { usePublicListDetails } from '../features/social/hooks/useSocial'
import { PaginationFooter } from '../components/ui/PaginationFooter'
import { useClientPagination } from '../components/ui/useClientPagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function PublicListDetailsPage() {
  const { id } = useParams()
  const { data, isError, isLoading } = usePublicListDetails(id)
  const pager = useClientPagination(data?.items ?? [], 24)

  return (
    <PublicLayout ambient="detail">
      <main className="page-shell">
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState title="Lista no disponible" message="No existe o no tenés permiso para verla." /> : null}
        {data ? (
          <>
            <header className="mb-8">
              <div className="flex flex-wrap items-center gap-2">
                <VisibilityBadge value={data.visibility} />
                <Link to={`/users/${data.username}`} className="text-sm text-[var(--color-text-secondary)] hover:text-white">
                  @{data.username}
                </Link>
              </div>
              <h1 className="mt-3 text-4xl font-semibold">{data.title}</h1>
              <p className="mt-3 text-[var(--color-text-secondary)]">{data.description || 'Lista sin descripción.'}</p>
            </header>
            {data.items.length === 0 ? <EmptyState title="Lista vacía" message="No hay contenido visible." /> : null}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {pager.pagedItems.map((item) => (
                <Link key={item.id} to={item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`} className="block">
                  <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface-elevated)] shadow-[var(--shadow-poster)] transition hover:border-violet-200/[0.24]">
                    {item.posterUrl ? <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                  </div>
                  <h2 className="mt-3 line-clamp-2 text-sm font-semibold">{item.title}</h2>
                </Link>
              ))}
            </div>
            <PaginationFooter pager={pager} unit="títulos" />
          </>
        ) : null}
      </main>
    </PublicLayout>
  )
}
