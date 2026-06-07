import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useMovieBrowse, useMovieSearchPages } from '../features/public-media/hooks/usePublicMedia'
import type { MovieBrowseCategory } from '../features/public-media/hooks/usePublicMedia'
import type { MediaSummary } from '../features/public-media/types/publicMedia.types'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

const categories: Array<{ value: MovieBrowseCategory; label: string }> = [
  { value: 'popular', label: 'Populares' },
  { value: 'trending', label: 'Tendencia' },
  { value: 'now-playing', label: 'En cartelera' },
  { value: 'upcoming', label: 'Proximamente' },
  { value: 'top-rated', label: 'Mejor valoradas' },
]

export function MoviesSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const category = parseCategory(searchParams.get('category'))
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const browse = useMovieBrowse(category)
  const search = useMovieSearchPages(normalizedQuery)
  const activeQuery = canSearch ? search : browse
  const items = flattenUniquePages<MediaSummary>(activeQuery.data, (item) => `${item.mediaType}-${item.tmdbId}`)
  const title = canSearch ? `Resultados para "${normalizedQuery}"` : categories.find((item) => item.value === category)?.label ?? 'Peliculas'

  function changeCategory(value: MovieBrowseCategory) {
    setSearchParams(value === 'popular' ? {} : { category: value })
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader eyebrow="Peliculas" title="Peliculas" subtitle="Explora el catalogo publico o busca por titulo cuando ya tenes algo en mente." />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div className="max-w-2xl">
            <SearchInput value={query} placeholder="Buscar por titulo" onChange={setQuery} />
          </div>
          {!canSearch ? (
            <div className="flex flex-wrap gap-2">
              {categories.map((option) => (
                <button key={option.value} type="button" onClick={() => changeCategory(option.value)} className={segmentClass(category === option.value)}>
                  {option.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <section className="mt-10">
          <div className="mb-5">
            <p className="kicker">{canSearch ? 'Busqueda' : 'Catalogo'}</p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
          </div>
          {activeQuery.isLoading ? <LoadingSkeleton /> : null}
          {activeQuery.isError ? <ErrorState /> : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length === 0 ? (
            <EmptyState title="Sin resultados" message="No encontramos peliculas para esa busqueda." />
          ) : null}
          {!activeQuery.isLoading && !activeQuery.isError && items.length > 0 ? (
            <>
              <MediaGrid items={items} />
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
        {isLoading ? 'Cargando...' : 'Mostrar mas'}
      </button>
    </div>
  )
}

function segmentClass(isActive: boolean) {
  return `min-h-10 rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition ${
    isActive
      ? 'border-violet-200/40 bg-[var(--color-accent)] text-white'
      : 'border-white/10 bg-white/[0.045] text-[var(--color-text-secondary)] hover:bg-white/[0.08] hover:text-white'
  }`
}

function parseCategory(value: string | null): MovieBrowseCategory {
  return categories.some((option) => option.value === value) ? (value as MovieBrowseCategory) : 'popular'
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
