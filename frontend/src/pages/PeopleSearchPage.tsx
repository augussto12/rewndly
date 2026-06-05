import { useMemo, useState } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { PersonGrid } from '../components/media/PersonGrid/PersonGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { usePeopleSearch } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function PeopleSearchPage() {
  const [query, setQuery] = useState('')
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const { data, isError, isLoading } = usePeopleSearch(normalizedQuery)
  const canSearch = normalizedQuery.length >= 2

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-2xl">
          <p className="kicker">Personas</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Buscar actores y creadores</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Explora perfiles, biografias y filmografias conectadas al catalogo de peliculas y series.
          </p>
        </header>

        <div className="mt-8 max-w-2xl">
          <SearchInput value={query} placeholder="Buscar por nombre" onChange={setQuery} />
        </div>

        <section className="mt-10">
          {!canSearch ? <EmptyState title="Escribi al menos 2 caracteres" message="Los resultados apareceran al iniciar la busqueda." /> : null}
          {canSearch && isLoading ? <LoadingSkeleton /> : null}
          {canSearch && isError ? <ErrorState /> : null}
          {canSearch && !isLoading && !isError && data?.length === 0 ? (
            <EmptyState title="Sin resultados" message="No encontramos personas para esa busqueda." />
          ) : null}
          {canSearch && !isLoading && !isError && data && data.length > 0 ? <PersonGrid items={data} /> : null}
        </section>
      </main>
    </PublicLayout>
  )
}
