import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { PlatformFilter } from '../components/media/PlatformFilter/PlatformFilter'
import { RankedMediaGrid } from '../components/media/RankedMediaGrid/RankedMediaGrid'
import { SearchInput } from '../components/media/SearchInput/SearchInput'
import { useDiscoverMediaPages, useDiscoverOptions, useSeriesBrowse, useSeriesRanking, useSeriesSearchPages } from '../features/public-media/hooks/usePublicMedia'
import type { DiscoverFilters, MediaSummary, RankedMediaSummary } from '../features/public-media/types/publicMedia.types'
import { getSeriesDiscoveryCollection, seriesDiscoveryCollections, type SeriesDiscoveryView } from '../features/public-media/utils/discoveryCollections'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function SeriesSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''
  const providerParam = searchParams.get('provider') ?? ''
  const selectedProviderId = toNumber(providerParam)
  const collection = getSeriesDiscoveryCollection(searchParams.get('category'))
  const view = collection.value
  const normalizedQuery = useMemo(() => query.trim(), [query])
  const canSearch = normalizedQuery.length >= 2
  const hasPlatformFilter = selectedProviderId !== undefined
  const platformFilters = useMemo<DiscoverFilters>(() => {
    const baseFilters = collection.kind === 'discover' ? collection.filters ?? { mediaType: 'Series' } : getSeriesBrowseDiscoverFilters(collection.browseCategory)
    return { ...baseFilters, mediaType: 'Series', watchProviderId: selectedProviderId }
  }, [collection, selectedProviderId])
  const browse = useSeriesBrowse(collection.browseCategory ?? 'popular', !canSearch && !hasPlatformFilter && collection.kind === 'browse')
  const ranking = useSeriesRanking(collection.rankingKey ?? 'imdb', !canSearch && !hasPlatformFilter && collection.kind === 'ranking')
  const discover = useDiscoverMediaPages(collection.filters ?? { mediaType: 'Series' }, !canSearch && !hasPlatformFilter && collection.kind === 'discover')
  const platformDiscover = useDiscoverMediaPages(platformFilters, !canSearch && hasPlatformFilter)
  const search = useSeriesSearchPages(normalizedQuery, canSearch)
  const activeQuery = canSearch ? search : hasPlatformFilter ? platformDiscover : collection.kind === 'ranking' ? ranking : collection.kind === 'discover' ? discover : browse
  const items = flattenUniquePages<MediaSummary>(
    canSearch ? search.data : hasPlatformFilter ? platformDiscover.data : collection.kind === 'discover' ? discover.data : collection.kind === 'browse' ? browse.data : undefined,
    (item) => `${item.mediaType}-${item.tmdbId}`,
  )
  const rankedItems = flattenUniquePages<RankedMediaSummary>(
    !canSearch && !hasPlatformFilter && collection.kind === 'ranking' ? ranking.data : undefined,
    (item) => `${item.media.mediaType}-${item.media.tmdbId}`,
  )
  const { watchProviders } = useDiscoverOptions('Series')
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

  function changeCategory(value: SeriesDiscoveryView) {
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

  return (
    <PublicLayout>
      <main className="page-shell">
        <PageHeader eyebrow="Series" title="Series" subtitle="Navega series populares o busca por nombre cuando queres ir directo a una." />
        <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] lg:items-end">
          <div className="max-w-2xl">
            <SearchInput value={query} placeholder="Buscar por nombre" onChange={changeQuery} />
          </div>
          <PlatformFilter providers={watchProviders.data} value={providerParam} isLoading={watchProviders.isLoading} onChange={changeProvider} />
        </div>
        {!canSearch ? (
          <div className="scrollbar-cinema -mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
            {seriesDiscoveryCollections.map((option) => (
              <button key={option.value} type="button" onClick={() => changeCategory(option.value)} className={segmentClass(view === option.value)}>
                {option.label}
              </button>
            ))}
          </div>
        ) : null}

        <section className="mt-10">
          <div className="mb-5">
            <p className="kicker">{canSearch ? 'Busqueda' : 'Catalogo'}</p>
            <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
          </div>
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

function getSeriesBrowseDiscoverFilters(category: string | undefined): DiscoverFilters {
  switch (category) {
    case undefined:
      return { mediaType: 'Series', sortBy: 'vote_average.desc', minVoteAverage: 7 }
    case 'airing-today':
    case 'on-the-air':
      return { mediaType: 'Series', sortBy: 'first_air_date.desc' }
    case 'top-rated':
      return { mediaType: 'Series', sortBy: 'vote_average.desc', minVoteAverage: 7 }
    case 'trending':
    case 'popular':
    default:
      return { mediaType: 'Series', sortBy: 'popularity.desc' }
  }
}

function getEmptyMessage(canSearch: boolean, hasPlatformFilter: boolean, kind: string) {
  if (hasPlatformFilter) {
    return 'No encontramos series disponibles en esa plataforma para estos filtros.'
  }

  if (kind === 'ranking' && !canSearch) {
    return 'Todavia no hay un ranking global cacheado para mostrar.'
  }

  return 'No encontramos series para esa busqueda.'
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
  return `min-h-10 shrink-0 rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition ${
    isActive
      ? 'border-violet-200/40 bg-[var(--color-accent)] text-white'
      : 'border-white/10 bg-white/[0.045] text-[var(--color-text-secondary)] hover:bg-white/[0.08] hover:text-white'
  }`
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
