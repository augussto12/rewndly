import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { MediaGridSkeleton } from '../components/feedback/GridSkeleton/GridSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { PersonGrid } from '../components/media/PersonGrid/PersonGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { usePeopleBrowse, usePeopleSearchPages } from '../features/public-media/hooks/usePublicMedia'
import type { PeopleBrowseCategory } from '../features/public-media/hooks/usePublicMedia'
import type { PersonSummary } from '../features/public-media/types/publicMedia.types'
import { fillGridRows, flattenUniquePages } from '../lib/pagination'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { PublicLayout } from '../layouts/PublicLayout'

const categories: Array<{ value: PeopleBrowseCategory; label: string }> = [
  { value: 'popular', label: 'Populares' },
  { value: 'trending', label: 'Tendencia' },
]

export function PeopleSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const category: PeopleBrowseCategory = searchParams.get('cat') === 'trending' ? 'trending' : 'popular'
  const query = searchParams.get('q') ?? ''
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const browse = usePeopleBrowse(category)
  const search = usePeopleSearchPages(normalizedQuery)
  const activeQuery = canSearch ? search : browse
  const items = flattenUniquePages<PersonSummary>(activeQuery.data, (person) => String(person.tmdbId))
  const totalResults = getPeopleTotal(activeQuery.data)
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

  function changeCategory(value: PeopleBrowseCategory) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.set('cat', value)
      return next
    })
  }

  function clearSearch() {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      next.delete('q')
      return next
    })
  }

  return (
    <PublicLayout ambient="catalog">
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
          {canSearch ? (
            <button type="button" onClick={clearSearch} className="secondary-action min-h-11 px-4 py-2 text-sm lg:w-fit">
              Limpiar
            </button>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((option) => (
                <FilterChip key={option.value} active={category === option.value} onClick={() => changeCategory(option.value)}>
                  {option.label}
                </FilterChip>
              ))}
            </div>
          )}
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <p className="kicker">{canSearch ? 'Búsqueda' : 'Catálogo'}</p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
            {!activeQuery.isLoading && !activeQuery.isError && totalResults !== null ? (
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{formatResultCount(totalResults)}</p>
            ) : null}
          </div>
          {activeQuery.isLoading ? <MediaGridSkeleton /> : null}
          {activeQuery.isError ? (
            <ErrorState action={<button type="button" onClick={() => void activeQuery.refetch()} className="secondary-action">Reintentar</button>} />
          ) : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length === 0 ? (
            <EmptyState
              title="Sin resultados"
              message={canSearch ? 'No encontramos personas para esa búsqueda.' : 'No hay personas para mostrar por ahora.'}
            />
          ) : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length > 0 ? (
            <>
              <PersonGrid items={fillGridRows(items, Boolean(activeQuery.hasNextPage))} />
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

function getPeopleTotal(data: unknown) {
  const total = (data as { pages?: Array<{ totalResults?: number }> } | undefined)?.pages?.[0]?.totalResults
  return typeof total === 'number' ? total : null
}

function formatResultCount(count: number) {
  return count === 1 ? '1 resultado encontrado' : `${count.toLocaleString('es-AR')} resultados encontrados`
}

