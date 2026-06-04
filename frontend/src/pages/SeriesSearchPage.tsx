import { useMemo, useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useSeriesSearch } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function SeriesSearchPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const { data, isError, isLoading } = useSeriesSearch(normalizedQuery)
  const canSearch = normalizedQuery.length >= 2

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader eyebrow="Series" title="Buscar series" subtitle="Navega series publicas con una experiencia visual conectada al catalogo cuando TMDB este configurado." />
        <div className="mt-8 max-w-2xl">
          <SearchInput value={query} placeholder="Buscar por nombre" onChange={setQuery} />
        </div>

        <section className="mt-10">
          {!canSearch ? <EmptyState title="Escribi al menos 2 caracteres" message="Los resultados apareceran al iniciar la busqueda." /> : null}
          {canSearch && isLoading ? <LoadingSkeleton /> : null}
          {canSearch && isError ? <ErrorState /> : null}
          {canSearch && !isLoading && !isError && data?.length === 0 ? (
            <EmptyState title="Sin resultados" message="No encontramos series para esa busqueda." />
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
