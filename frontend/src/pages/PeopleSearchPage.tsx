import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { PersonGrid } from '../components/media/PersonGrid/PersonGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { usePeopleBrowse, usePeopleSearchPages } from '../features/public-media/hooks/usePublicMedia'
import type { PeopleBrowseCategory } from '../features/public-media/hooks/usePublicMedia'
import type { PersonSummary } from '../features/public-media/types/publicMedia.types'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

const categories: Array<{ value: PeopleBrowseCategory; label: string }> = [
  { value: 'popular', label: 'Populares' },
  { value: 'trending', label: 'Tendencia' },
]

export function PeopleSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [category, setCategory] = useState<PeopleBrowseCategory>('popular')
  const query = searchParams.get('q') ?? ''
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const browse = usePeopleBrowse(category)
  const search = usePeopleSearchPages(normalizedQuery)
  const activeQuery = canSearch ? search : browse
  const items = flattenUniquePages<PersonSummary>(activeQuery.data, (person) => String(person.tmdbId))
  const title = canSearch ? `Resultados para "${normalizedQuery}"` : categories.find((item) => item.value === category)?.label ?? 'Personas'

  function changeQuery(value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      if (value.trim()) {
        next.set('q', value)
      } else {
        next.delete('q')
      }

      return next
    })
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-2xl">
          <p className="kicker">Personas</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Buscar actores y creadores</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Explorá perfiles, biografías y filmografías conectadas al catálogo de películas y series.
          </p>
        </header>

        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <SearchInput value={query} placeholder="Buscar por nombre" onChange={changeQuery} />
          </div>
          {!canSearch ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((option) => (
                <FilterChip key={option.value} active={category === option.value} onClick={() => setCategory(option.value)}>
                  {option.label}
                </FilterChip>
              ))}
            </div>
          ) : null}
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <p className="kicker">{canSearch ? 'Búsqueda' : 'Catálogo'}</p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
          </div>
          {activeQuery.isLoading ? <LoadingSkeleton /> : null}
          {activeQuery.isError ? <ErrorState /> : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length === 0 ? (
            <EmptyState title="Sin resultados" message="No encontramos personas para esa búsqueda." />
          ) : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length > 0 ? (
            <>
              <PersonGrid items={items} />
              <LoadMoreButton
                hasMore={Boolean(activeQuery.hasNextPage)}
                isLoading={activeQuery.isFetchingNextPage}
                onClick={() => void activeQuery.fetchNextPage()}
              />
            </>
          ) : null}
        </section>
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
        {isLoading ? 'Cargando...' : 'Mostrar más'}
      </button>
    </div>
  )
}
