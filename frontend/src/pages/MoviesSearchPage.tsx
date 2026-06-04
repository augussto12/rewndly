import { useMemo, useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useMovieSearch } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function MoviesSearchPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const { data, isError, isLoading } = useMovieSearch(normalizedQuery)
  const canSearch = normalizedQuery.length >= 2

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader eyebrow="Peliculas" title="Buscar peliculas" subtitle="Explora el catalogo publico sin obligarte a registrarte antes de encontrar algo que valga la pena." />
        <div className="mt-8 max-w-2xl">
          <SearchInput value={query} placeholder="Buscar por titulo" onChange={setQuery} />
        </div>

        <section className="mt-10">
          {!canSearch ? <EmptyState title="Escribi al menos 2 caracteres" message="Los resultados apareceran al iniciar la busqueda." /> : null}
          {canSearch && isLoading ? <LoadingSkeleton /> : null}
          {canSearch && isError ? <ErrorState /> : null}
          {canSearch && !isLoading && !isError && data?.length === 0 ? (
            <EmptyState title="Sin resultados" message="No encontramos peliculas para esa busqueda." />
          ) : null}
          {canSearch && !isLoading && !isError && data && data.length > 0 ? <MediaGrid items={data} /> : null}
        </section>
      </main>
    </PublicLayout>
  )
}

function PageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <header className="max-w-2xl">
      <p className="kicker">{eyebrow}</p>
      <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">{title}</h1>
      <p className="mt-4 text-[var(--color-text-secondary)]">{subtitle}</p>
    </header>
  )
}
