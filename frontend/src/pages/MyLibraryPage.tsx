import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { useDeleteLibraryItem, useMyLibrary } from '../features/user-content/hooks/useUserContent'
import { PublicLayout } from '../layouts/PublicLayout'

export function MyLibraryPage() {
  const { data, isError, isLoading } = useMyLibrary()
  const deleteItem = useDeleteLibraryItem()

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader title="Mi biblioteca" subtitle="Tu relacion personal con peliculas y series." />
        {isLoading ? <LoadingSkeleton /> : null}
        {isError ? <ErrorState /> : null}
        {!isLoading && !isError && data?.length === 0 ? (
          <EmptyState title="Biblioteca vacia" message="Guarda contenido desde el detalle de una pelicula o serie." />
        ) : null}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {data?.map((item) => (
            <article key={item.id} className="surface-panel p-4">
              <Link to={item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`} className="block">
                <div className="aspect-[2/3] overflow-hidden rounded-[var(--radius-sm)] border border-white/10 bg-white/5">
                  {item.posterUrl ? <img src={item.posterUrl} alt={item.title} className="h-full w-full object-cover" /> : null}
                </div>
                <h2 className="mt-3 line-clamp-2 font-semibold">{item.title}</h2>
              </Link>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {item.status} {item.rating ? `/ ${item.rating}/10` : ''}
              </p>
              <button onClick={() => void deleteItem.mutateAsync(item.id)} className="secondary-action mt-3">
                Quitar
              </button>
            </article>
          ))}
        </div>
      </main>
    </PublicLayout>
  )
}

function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-8">
      <p className="kicker">Rewndly</p>
      <h1 className="mt-3 text-4xl font-semibold">{title}</h1>
      <p className="mt-3 text-[var(--color-text-secondary)]">{subtitle}</p>
    </header>
  )
}
