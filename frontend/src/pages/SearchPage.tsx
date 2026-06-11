import { useMemo, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { PersonGrid } from '../components/media/PersonGrid/PersonGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useMovieSearch, usePeopleSearch, useSeriesSearch } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const movies = useMovieSearch(normalizedQuery)
  const series = useSeriesSearch(normalizedQuery)
  const people = usePeopleSearch(normalizedQuery)
  const isLoading = canSearch && (movies.isLoading || series.isLoading || people.isLoading)
  const isError = movies.isError || series.isError || people.isError
  const movieItems = movies.data?.items ?? []
  const seriesItems = series.data?.items ?? []
  const peopleItems = people.data?.items ?? []
  const totalResults = (movies.data?.totalResults ?? 0) + (series.data?.totalResults ?? 0) + (people.data?.totalResults ?? 0)
  const hasResults = movieItems.length > 0 || seriesItems.length > 0 || peopleItems.length > 0

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

  function clearSearch() {
    setSearchParams({})
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Búsqueda</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Buscar en Rewndly</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Encontrá películas, series y personas sin caer en una página perdida.
          </p>
        </header>

        <section className="surface-panel mt-8 p-4 sm:p-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-end">
            <SearchInput value={query} placeholder="Buscar películas, series o personas" onChange={changeQuery} />
            {query ? (
              <button type="button" onClick={clearSearch} className="secondary-action min-h-11 px-4 py-2 text-sm">
                Limpiar
              </button>
            ) : null}
          </div>
          {canSearch ? (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">
              {isLoading ? 'Buscando...' : formatSearchSummary(totalResults, normalizedQuery)}
            </p>
          ) : (
            <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Escribí al menos 2 caracteres para buscar.</p>
          )}
        </section>

        {isLoading ? <div className="mt-10"><LoadingSkeleton /></div> : null}
        {isError ? <div className="mt-10"><ErrorState title="No pudimos completar la búsqueda" message="Probá de nuevo en unos segundos." /></div> : null}
        {!isLoading && !isError && canSearch && !hasResults ? (
          <div className="mt-10">
            <EmptyState title="Sin resultados" message="Probá con otro título, persona o una palabra más corta." />
          </div>
        ) : null}
        {!canSearch && !isLoading ? (
          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Link to="/movies/search" className="surface-panel p-5 transition hover:border-violet-200/25">
              <p className="kicker">Catálogo</p>
              <h2 className="mt-2 text-xl font-semibold">Explorar películas</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Entrá al listado con filtros, plataformas y rankings.</p>
            </Link>
            <Link to="/series/search" className="surface-panel p-5 transition hover:border-violet-200/25">
              <p className="kicker">Catálogo</p>
              <h2 className="mt-2 text-xl font-semibold">Explorar series</h2>
              <p className="mt-2 text-sm leading-6 text-[var(--color-text-secondary)]">Buscá series populares, nuevas o para maratonear.</p>
            </Link>
          </div>
        ) : null}

        {!isLoading && !isError && hasResults ? (
          <div className="mt-10 space-y-12">
            <ResultSection title="Películas" count={movies.data?.totalResults ?? movieItems.length} viewAllHref={`/movies/search?q=${encodeURIComponent(normalizedQuery)}`}>
              {movieItems.length > 0 ? <MediaGrid items={movieItems.slice(0, 12)} /> : <EmptyMini label="Sin películas para esta búsqueda." />}
            </ResultSection>
            <ResultSection title="Series" count={series.data?.totalResults ?? seriesItems.length} viewAllHref={`/series/search?q=${encodeURIComponent(normalizedQuery)}`}>
              {seriesItems.length > 0 ? <MediaGrid items={seriesItems.slice(0, 12)} /> : <EmptyMini label="Sin series para esta búsqueda." />}
            </ResultSection>
            <ResultSection title="Personas" count={people.data?.totalResults ?? peopleItems.length} viewAllHref={`/people/search?q=${encodeURIComponent(normalizedQuery)}`}>
              {peopleItems.length > 0 ? <PersonGrid items={peopleItems.slice(0, 12)} /> : <EmptyMini label="Sin personas para esta búsqueda." />}
            </ResultSection>
          </div>
        ) : null}
      </main>
    </PublicLayout>
  )
}

function ResultSection({ title, count, viewAllHref, children }: { title: string; count: number; viewAllHref: string; children: ReactNode }) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{formatCount(count)}</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        {count > 0 ? (
          <Link to={viewAllHref} className="secondary-action min-h-9 px-3 py-2 text-xs">
            Ver todo
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function EmptyMini({ label }: { label: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] px-4 py-5 text-sm text-[var(--color-text-secondary)]">
      {label}
    </div>
  )
}

function formatSearchSummary(count: number, query: string) {
  return count === 1 ? `1 resultado encontrado para "${query}".` : `${count} resultados encontrados para "${query}".`
}

function formatCount(count: number) {
  if (count === 1) return '1 resultado'
  return `${count} resultados`
}
