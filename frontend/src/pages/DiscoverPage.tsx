import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { MediaGridSkeleton } from '../components/feedback/GridSkeleton/GridSkeleton'
import { FilterChip } from '../components/filters/FilterChip'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { discoverMovies, discoverSeries } from '../features/public-media/services/publicMediaApi'
import {
  useDiscoverMediaPages,
  useDiscoverOptions,
  useMovieRanking,
  useTopRatedMovies,
} from '../features/public-media/hooks/usePublicMedia'
import { useLibraryRecommendations } from '../features/public-media/hooks/useLibraryRecommendations'
import { useBestMoviesOfYear } from '../features/public-media/hooks/useBestMoviesOfYear'
import { useGems } from '../features/public-media/hooks/useGems'
import type { DiscoverFilters, MediaSummary, RankedMediaSummary } from '../features/public-media/types/publicMedia.types'
import { exploreMoodCollections, getMovieDiscoveryCollection } from '../features/public-media/utils/discoveryCollections'
import { fillGridRows, flattenUniquePages } from '../lib/pagination'
import { LoadMoreButton } from '../components/ui/LoadMoreButton'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { PublicLayout } from '../layouts/PublicLayout'

const movieSortOptions = [
  { value: 'popularity.desc', label: 'Popularidad' },
  { value: 'vote_average.desc', label: 'Mejor rating' },
  { value: 'primary_release_date.desc', label: 'Estrenos recientes' },
  { value: 'revenue.desc', label: 'Recaudación' },
]

const seriesSortOptions = [
  { value: 'popularity.desc', label: 'Popularidad' },
  { value: 'vote_average.desc', label: 'Mejor rating' },
  { value: 'first_air_date.desc', label: 'Emisión reciente' },
]

export function DiscoverPage() {
  const navigate = useNavigate()
  const [mediaType, setMediaType] = useState<'Movie' | 'Series'>('Movie')
  const [genreId, setGenreId] = useState('')
  const [year, setYear] = useState('')
  const [watchProviderId, setWatchProviderId] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [minVoteAverage, setMinVoteAverage] = useState('0')
  const [showFilters, setShowFilters] = useState(false)
  const [activeMood, setActiveMood] = useState(exploreMoodCollections[0].value)
  const [isSurprising, setIsSurprising] = useState(false)

  const manualFilters = useMemo<DiscoverFilters>(
    () => ({
      mediaType,
      genreId: toNumber(genreId),
      year: toNumber(year),
      watchProviderId: toNumber(watchProviderId),
      sortBy,
      minVoteAverage: toNumber(minVoteAverage),
    }),
    [genreId, mediaType, minVoteAverage, sortBy, watchProviderId, year],
  )
  const mood = exploreMoodCollections.find((item) => item.value === activeMood)
  const filters = mood?.filters ?? manualFilters
  const results = useDiscoverMediaPages(filters)
  const data = flattenUniquePages<MediaSummary>(results.data, (item) => `${item.mediaType}-${item.tmdbId}`)
  const totalResults = getTotalResults(results.data)
  const { genres, watchProviders } = useDiscoverOptions(mediaType)
  const topRatedMovies = useTopRatedMovies()
  const criticRanking = useMovieRanking('critics')
  const classicsCollection = getMovieDiscoveryCollection('classics')
  const gems = useGems(12)
  const classics = useDiscoverMediaPages(classicsCollection.filters ?? { mediaType: 'Movie' })
  const sortOptions = mediaType === 'Movie' ? movieSortOptions : seriesSortOptions
  const criticPicks = flattenUniquePages<RankedMediaSummary>(criticRanking.data, (item) => `${item.media.mediaType}-${item.media.tmdbId}`)
    .map((item) => item.media)
    .slice(0, 12)
  const gemsItems = gems.items
  const classicsItems = flattenUniquePages<MediaSummary>(classics.data, (item) => `${item.mediaType}-${item.tmdbId}`).slice(0, 12)
  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => Array.from({ length: currentYear - 1969 }, (_, index) => currentYear - index), [currentYear])
  const [bestYear, setBestYear] = useState(currentYear)
  const bestOfYear = useBestMoviesOfYear(bestYear)
  const bestOfYearItems = bestOfYear.items
  const recommendations = useLibraryRecommendations()

  function changeMediaType(value: 'Movie' | 'Series') {
    setActiveMood('')
    setMediaType(value)
    setGenreId('')
    setWatchProviderId('')
    setSortBy('popularity.desc')
  }

  function clearMood() {
    setActiveMood('')
  }

  async function surpriseMe() {
    if (isSurprising) {
      return
    }

    setIsSurprising(true)

    try {
      let picked: MediaSummary | null = null

      try {
        picked = await pickRandomDiscoverResult(filters, results.data?.pages[0])
      } catch {
        picked = pickRandomItem(data)
      }

      if (picked) {
        navigate(picked.mediaType === 'Movie' ? `/movies/${picked.tmdbId}` : `/series/${picked.tmdbId}`)
      }
    } finally {
      setIsSurprising(false)
    }
  }

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">¿No sabés qué ver?</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Elegí un ánimo, dejá que Rewndly cruce catálogo y ratings, o refiná filtros cuando querés hilar más fino.
          </p>
        </header>

        <section className="surface-panel mt-8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-cinema -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {exploreMoodCollections.map((option) => (
                <FilterChip
                  key={option.value}
                  active={activeMood === option.value}
                  onClick={() => setActiveMood(option.value)}
                >
                  {option.label}
                </FilterChip>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => void surpriseMe()} disabled={data.length === 0 || isSurprising} className="primary-action min-h-10 px-4 py-2 text-sm">
                {isSurprising ? 'Buscando...' : 'Sorprendeme'}
              </button>
              <button type="button" onClick={() => setShowFilters((value) => !value)} className={`secondary-action min-h-10 px-4 py-2 text-sm ${showFilters ? 'border-violet-200/40 bg-white/[0.09]' : ''}`}>
                Afinar
              </button>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-[var(--color-text-secondary)]">
            {mood ? getMoodDescription(mood.value) : 'Filtros manuales activos.'}
            {totalResults !== null && !results.isLoading ? ` ${formatResultCount(totalResults)}.` : ''}
          </p>

          {showFilters ? (
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[auto_1fr_1fr_1fr_1fr_12rem]">
              <div>
                <span className="block text-sm text-[var(--color-text-secondary)]">Tipo</span>
                <SegmentedControl
                  ariaLabel="Tipo de contenido"
                  className="mt-2"
                  value={mediaType}
                  onChange={changeMediaType}
                  options={[
                    { value: 'Movie', label: 'Películas' },
                    { value: 'Series', label: 'Series' },
                  ]}
                />
              </div>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Género
                <select
                  value={genreId}
                  onChange={(event) => {
                    clearMood()
                    setGenreId(event.target.value)
                  }}
                  className="field mt-2"
                >
                  <option value="">Todos</option>
                  {genres.data?.map((genre) => (
                    <option key={genre.tmdbId} value={genre.tmdbId}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Proveedor
                <select
                  value={watchProviderId}
                  onChange={(event) => {
                    clearMood()
                    setWatchProviderId(event.target.value)
                  }}
                  className="field mt-2"
                >
                  <option value="">Todos</option>
                  {watchProviders.data?.map((provider) => (
                    <option key={provider.providerId} value={provider.providerId}>
                      {provider.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Año
                <input
                  value={year}
                  onChange={(event) => {
                    clearMood()
                    setYear(event.target.value)
                  }}
                  type="number"
                  min="1900"
                  max="2100"
                  placeholder="Todos"
                  className="field mt-2"
                />
              </label>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Orden
                <select
                  value={sortBy}
                  onChange={(event) => {
                    clearMood()
                    setSortBy(event.target.value)
                  }}
                  className="field mt-2"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Rating min.
                <input
                  value={minVoteAverage}
                  onChange={(event) => {
                    clearMood()
                    setMinVoteAverage(event.target.value)
                  }}
                  type="number"
                  min="0"
                  max="10"
                  step="0.5"
                  className="field mt-2"
                />
              </label>
            </div>
          ) : null}
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p key={mood ? `mood-${activeMood}` : `manual-${mediaType}-${genreId}-${year}-${sortBy}-${minVoteAverage}`} className="kicker animate-[panel-enter_220ms_ease-out]">
                {mood ? 'Ánimo' : 'Resultados'}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">{mood?.label ?? (mediaType === 'Movie' ? 'Películas encontradas' : 'Series encontradas')}</h2>
              {totalResults !== null && !results.isLoading ? (
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{formatResultCount(totalResults)}</p>
              ) : null}
            </div>
          </div>
          {results.isLoading ? <MediaGridSkeleton /> : null}
          {results.isError ? (
            <ErrorState
              title="No pudimos cargar discovery"
              action={<button type="button" onClick={() => void results.refetch()} className="secondary-action">Reintentar</button>}
            />
          ) : null}
          {!results.isLoading && !results.isError && data.length === 0 ? (
            <EmptyState title="Sin resultados" message="Probá otro ánimo o tocá Afinar para cambiar filtros." />
          ) : null}
          {!results.isLoading && !results.isError && data.length > 0 ? (
            <>
              <MediaGrid items={fillGridRows(data, Boolean(results.hasNextPage))} />
              <LoadMoreButton
                hasMore={Boolean(results.hasNextPage)}
                isLoading={results.isFetchingNextPage}
                onClick={() => void results.fetchNextPage()}
              />
            </>
          ) : null}
        </section>

        {recommendations.isAuthenticated && (recommendations.hasSeeds || recommendations.isLoading) ? (
          <section className="mt-12">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="kicker">Para vos</p>
                <h2 className="mt-2 text-2xl font-semibold">Recomendado según tu biblioteca</h2>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Cruzamos lo que marcaste como visto, favorito o puntuaste alto para sugerirte pelis que todavía no tenés.
                </p>
              </div>
              <Link to="/recomendados" className="secondary-action min-h-9 shrink-0 px-3 py-2 text-xs">
                Ver todo
              </Link>
            </div>
            {recommendations.isLoading ? (
              <MediaGridSkeleton />
            ) : recommendations.recommendations.length > 0 ? (
              <MediaGrid items={recommendations.recommendations.slice(0, 12)} />
            ) : (
              <EmptyState title="Todavía sin recomendaciones" message="Marcá algunas pelis como vistas o favoritas y vas a ver sugerencias personalizadas acá." />
            )}
          </section>
        ) : null}

        <section className="mt-12">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Ranking</p>
              <h2 className="mt-2 text-2xl font-semibold">Mejores películas del año</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Las mejor puntuadas de cada año, para cuando no sabés qué ver.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                Año
                <select value={bestYear} onChange={(event) => setBestYear(Number(event.target.value))} className="field w-28" aria-label="Año">
                  {yearOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <Link to="/recomendados" className="secondary-action min-h-9 px-3 py-2 text-xs">
                Ver todo
              </Link>
            </div>
          </div>
          {bestOfYear.isLoading ? (
            <MediaGridSkeleton />
          ) : bestOfYearItems.length > 0 ? (
            <MediaGrid items={bestOfYearItems} />
          ) : (
            <EmptyState title="Sin resultados" message="No encontramos películas mejor puntuadas para ese año." />
          )}
        </section>

        <QuickShelf kicker="Radar Rewndly" title="Joyas modernas" items={gemsItems} viewAllHref="/movies/search?category=gems" />
        <QuickShelf kicker="Crítica" title="Aclamadas por crítica" items={criticPicks} viewAllHref="/movies/search?category=top-critics" />
        <QuickShelf kicker="Audiencia" title="El público las ama" items={topRatedMovies.data?.items ?? []} viewAllHref="/movies/search?category=audience" />
        <QuickShelf kicker="Archivo" title="Clásicos imprescindibles" items={classicsItems} viewAllHref="/movies/search?category=classics" />
      </main>
    </PublicLayout>
  )
}

function QuickShelf({ kicker, title, items, viewAllHref }: { kicker: string; title: string; items: MediaSummary[]; viewAllHref: string }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">{kicker}</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        <Link to={viewAllHref} className="secondary-action min-h-9 px-3 py-2 text-xs">
          Ver todo
        </Link>
      </div>
      <MediaGrid items={items.slice(0, 12)} />
    </section>
  )
}

function getTotalResults(data: unknown) {
  const pages = (data as { pages?: Array<{ totalResults?: number }> } | undefined)?.pages
  const total = pages?.[0]?.totalResults
  return typeof total === 'number' ? total : null
}

function formatResultCount(count: number) {
  return count === 1 ? '1 resultado encontrado' : `${count.toLocaleString('es-AR')} resultados encontrados`
}

function getMoodDescription(value: string) {
  switch (value) {
    case 'intense':
      return 'Historias con tensión, conflicto y pulso alto.'
    case 'light':
      return 'Opciones más livianas para ver sin demasiado compromiso.'
    case 'weird':
      return 'Películas raras, de ciencia ficción o con una vuelta distinta.'
    case 'classic':
      return 'Clásicos y títulos consolidados para ir a lo seguro.'
    case 'short':
      return 'Películas más cortas para cuando no querés una maratón.'
    case 'acclaimed':
      return 'Títulos con buena recepción y rating alto.'
    default:
      return 'Recomendaciones cruzadas por catálogo y rating.'
  }
}

function toNumber(value: string) {
  if (!value) {
    return undefined
  }

  const number = Number(value)
  return Number.isFinite(number) ? number : undefined
}

async function pickRandomDiscoverResult(filters: DiscoverFilters, firstPage?: { page: number; totalPages: number; items: MediaSummary[] }) {
  const maxPage = Math.max(firstPage?.totalPages ?? 1, 1)
  const triedPages = new Set<number>()

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const page = randomPage(maxPage, triedPages)
    triedPages.add(page)

    const response = page === firstPage?.page ? firstPage : await getDiscoverPage(filters, page)
    const picked = pickRandomItem(response.items)

    if (picked) {
      return picked
    }

    if (triedPages.size >= maxPage) {
      break
    }
  }

  return pickRandomItem(firstPage?.items ?? [])
}

function getDiscoverPage(filters: DiscoverFilters, page: number) {
  const { mediaType, ...request } = filters
  return mediaType === 'Movie' ? discoverMovies(request, page) : discoverSeries(request, page)
}

function pickRandomItem(items: MediaSummary[]) {
  return items[Math.floor(Math.random() * Math.max(items.length, 1))] ?? null
}

function randomPage(maxPage: number, triedPages: Set<number>) {
  if (triedPages.size >= maxPage) {
    return 1
  }

  let page = 1
  do {
    page = Math.floor(Math.random() * maxPage) + 1
  } while (triedPages.has(page))

  return page
}
