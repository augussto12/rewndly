import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { PlatformFilter } from '../components/media/PlatformFilter/PlatformFilter'
import { RankedMediaGrid } from '../components/media/RankedMediaGrid/RankedMediaGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useDiscoverMediaPages, useDiscoverOptions, useMovieBrowse, useMovieRanking, useMovieSearchPages } from '../features/public-media/hooks/usePublicMedia'
import type { DiscoverFilters, MediaSummary, RankedMediaSummary } from '../features/public-media/types/publicMedia.types'
import { getMovieDiscoveryCollection, movieDiscoveryCollections, type MovieDiscoveryView } from '../features/public-media/utils/discoveryCollections'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function MoviesSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const providerParam = searchParams.get('provider') ?? ''
  const selectedProviderId = toNumber(providerParam)
  const collection = getMovieDiscoveryCollection(searchParams.get('category'))
  const view = collection.value
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const hasPlatformFilter = selectedProviderId !== undefined
  const platformFilters = useMemo<DiscoverFilters>(() => {
    const baseFilters = collection.kind === 'discover' ? collection.filters ?? { mediaType: 'Movie' } : getMovieBrowseDiscoverFilters(collection.browseCategory)
    return { ...baseFilters, mediaType: 'Movie', watchProviderId: selectedProviderId }
  }, [collection, selectedProviderId])
  const browse = useMovieBrowse(collection.browseCategory ?? 'popular', !canSearch && !hasPlatformFilter && collection.kind === 'browse')
  const ranking = useMovieRanking(collection.rankingKey ?? 'imdb', !canSearch && !hasPlatformFilter && collection.kind === 'ranking')
  const discover = useDiscoverMediaPages(collection.filters ?? { mediaType: 'Movie' }, !canSearch && !hasPlatformFilter && collection.kind === 'discover')
  const platformDiscover = useDiscoverMediaPages(platformFilters, !canSearch && hasPlatformFilter)
  const search = useMovieSearchPages(normalizedQuery, canSearch)
  const activeQuery = canSearch ? search : hasPlatformFilter ? platformDiscover : collection.kind === 'ranking' ? ranking : collection.kind === 'discover' ? discover : browse
  const items = flattenUniquePages<MediaSummary>(
    canSearch ? search.data : hasPlatformFilter ? platformDiscover.data : collection.kind === 'discover' ? discover.data : collection.kind === 'browse' ? browse.data : undefined,
    (item) => `${item.mediaType}-${item.tmdbId}`,
  )
  const rankedItems = flattenUniquePages<RankedMediaSummary>(
    !canSearch && !hasPlatformFilter && collection.kind === 'ranking' ? ranking.data : undefined,
    (item) => `${item.media.mediaType}-${item.media.tmdbId}`,
  )
  const { watchProviders } = useDiscoverOptions('Movie')
  const selectedProvider = watchProviders.data?.find((provider) => provider.providerId === selectedProviderId)
  const titlePrefix = hasPlatformFilter && collection.kind === 'ranking' ? 'Mejor valoradas' : collection.label
  const title = canSearch
    ? `Resultados para "${normalizedQuery}"`
    : selectedProvider
      ? `${titlePrefix} en ${selectedProvider.name}`
      : hasPlatformFilter
        ? `${titlePrefix} en plataforma`
        : collection.label
  const isLoading = activeQuery.isLoading
  const hasResults = collection.kind === 'ranking' && !canSearch && !hasPlatformFilter ? rankedItems.length > 0 : items.length > 0
  const totalResults = getTotalResults(activeQuery.data)
  const activeFilterLabels = [
    canSearch ? `Búsqueda: "${normalizedQuery}"` : '',
    !canSearch && view !== 'popular' ? `Categoría: ${collection.label}` : '',
    selectedProvider ? `Plataforma: ${selectedProvider.name}` : hasPlatformFilter ? 'Plataforma seleccionada' : '',
  ].filter(Boolean)

  function changeCategory(value: MovieDiscoveryView) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      if (value === 'popular') {
        next.delete('category')
      } else {
        next.set('category', value)
      }

      return next
    })
  }

  function changeQuery(value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      if (value.trim()) {
        next.set('q', value)
        next.delete('provider')
      } else {
        next.delete('q')
      }

      next.delete('quality')
      return next
    })
  }

  function changeProvider(value: string) {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)

      if (value) {
        next.set('provider', value)
        next.delete('q')
      } else {
        next.delete('provider')
      }

      return next
    })
  }

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader eyebrow="Catálogo" title="Películas" subtitle="Explorá el catálogo o buscá por título cuando ya tenés algo en mente." />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-end">
          <div className="max-w-2xl">
            <SearchInput value={query} placeholder="Buscar por título" onChange={changeQuery} />
          </div>
          <PlatformFilter providers={watchProviders.data} value={providerParam} isLoading={watchProviders.isLoading} onChange={changeProvider} />
        </div>
        {!canSearch ? (
          <div className="scrollbar-cinema -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {movieDiscoveryCollections.map((option) => (
              <FilterChip key={option.value} active={view === option.value} onClick={() => changeCategory(option.value)}>
                {option.label}
              </FilterChip>
            ))}
          </div>
        ) : null}

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">{canSearch ? 'Búsqueda' : 'Resultados'}</p>
              <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
              {!isLoading && !activeQuery.isError && totalResults !== null ? (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{formatResultCount(totalResults)}</p>
              ) : null}
            </div>
            {activeFilterLabels.length > 0 ? (
              <button type="button" onClick={clearFilters} className="secondary-action min-h-9 px-3 py-2 text-xs">
                Limpiar filtros
              </button>
            ) : null}
          </div>
          {activeFilterLabels.length > 0 ? (
            <div className="mb-5 flex flex-wrap gap-2">
              {activeFilterLabels.map((label) => (
                <span key={label} className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-violet-100">
                  {label}
                </span>
              ))}
            </div>
          ) : null}
          {isLoading ? <LoadingSkeleton /> : null}
          {activeQuery.isError ? <ErrorState /> : null}
          {!isLoading && !activeQuery.isError && !hasResults ? (
            <EmptyState title="Sin resultados" message={getEmptyMessage(canSearch, hasPlatformFilter, collection.kind)} />
          ) : null}
          {!isLoading && !activeQuery.isError && hasResults ? (
            <>
              {collection.kind === 'ranking' && !canSearch && !hasPlatformFilter ? <RankedMediaGrid items={rankedItems} /> : <MediaGrid items={items} />}
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

function getMovieBrowseDiscoverFilters(category: string | undefined): DiscoverFilters {
  switch (category) {
    case undefined:
      return { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7 }
    case 'now-playing':
      return { mediaType: 'Movie', sortBy: 'primary_release_date.desc' }
    case 'upcoming':
      return { mediaType: 'Movie', sortBy: 'primary_release_date.desc', yearFrom: new Date().getFullYear() }
    case 'top-rated':
      return { mediaType: 'Movie', sortBy: 'vote_average.desc', minVoteAverage: 7 }
    case 'trending':
    case 'popular':
    default:
      return { mediaType: 'Movie', sortBy: 'popularity.desc' }
  }
}

function getEmptyMessage(canSearch: boolean, hasPlatformFilter: boolean, kind: string) {
  if (hasPlatformFilter) {
    return 'No encontramos películas disponibles en esa plataforma para estos filtros.'
  }

  if (kind === 'ranking' && !canSearch) {
    return 'Todavía no hay un ranking global guardado para mostrar.'
  }

  return 'No encontramos películas para esa búsqueda.'
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

function getTotalResults(data: unknown) {
  const pages = (data as { pages?: Array<{ totalResults?: number }> } | undefined)?.pages
  const total = pages?.[0]?.totalResults
  return typeof total === 'number' ? total : null
}

function formatResultCount(count: number) {
  return count === 1 ? '1 resultado' : `${count.toLocaleString('es-AR')} resultados`
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

function toNumber(value: string) {
  if (!value) {
    return undefined
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}
