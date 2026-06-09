import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { discoverMovies, discoverSeries } from '../features/public-media/services/publicMediaApi'
import {
  useDiscoverMediaPages,
  useDiscoverOptions,
  useMovieRanking,
  useTopRatedMovies,
} from '../features/public-media/hooks/usePublicMedia'
import type { DiscoverFilters, MediaSummary, RankedMediaSummary } from '../features/public-media/types/publicMedia.types'
import { exploreMoodCollections, getMovieDiscoveryCollection } from '../features/public-media/utils/discoveryCollections'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

const movieSortOptions = [
  { value: 'popularity.desc', label: 'Popularidad' },
  { value: 'vote_average.desc', label: 'Mejor rating' },
  { value: 'primary_release_date.desc', label: 'Estrenos recientes' },
  { value: 'revenue.desc', label: 'Recaudacion' },
]

const seriesSortOptions = [
  { value: 'popularity.desc', label: 'Popularidad' },
  { value: 'vote_average.desc', label: 'Mejor rating' },
  { value: 'first_air_date.desc', label: 'Emision reciente' },
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
  const { genres, watchProviders } = useDiscoverOptions(mediaType)
  const topRatedMovies = useTopRatedMovies()
  const criticRanking = useMovieRanking('critics')
  const gemsCollection = getMovieDiscoveryCollection('gems')
  const classicsCollection = getMovieDiscoveryCollection('classics')
  const gems = useDiscoverMediaPages(gemsCollection.filters ?? { mediaType: 'Movie' })
  const classics = useDiscoverMediaPages(classicsCollection.filters ?? { mediaType: 'Movie' })
  const sortOptions = mediaType === 'Movie' ? movieSortOptions : seriesSortOptions
  const criticPicks = flattenUniquePages<RankedMediaSummary>(criticRanking.data, (item) => `${item.media.mediaType}-${item.media.tmdbId}`)
    .map((item) => item.media)
    .slice(0, 12)
  const gemsItems = flattenUniquePages<MediaSummary>(gems.data, (item) => `${item.mediaType}-${item.tmdbId}`).slice(0, 12)
  const classicsItems = flattenUniquePages<MediaSummary>(classics.data, (item) => `${item.mediaType}-${item.tmdbId}`).slice(0, 12)

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
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">No sabes que ver?</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Elegi un animo, deja que Rewndly cruce catalogo y ratings, o afina filtros cuando queres hilar mas fino.
          </p>
        </header>

        <section className="surface-panel mt-8 p-4 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="scrollbar-cinema -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-wrap lg:overflow-visible lg:px-0">
              {exploreMoodCollections.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setActiveMood(option.value)}
                  className={pillClass(activeMood === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={() => void surpriseMe()} disabled={data.length === 0 || isSurprising} className="primary-action min-h-10 px-4 py-2 text-sm">
                {isSurprising ? 'Buscando...' : 'Sorprendeme'}
              </button>
              <button type="button" onClick={() => setShowFilters((value) => !value)} className="secondary-action min-h-10 px-4 py-2 text-sm">
                Afinar
              </button>
            </div>
          </div>

          {showFilters ? (
            <div className="mt-5 grid gap-4 border-t border-white/10 pt-5 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_12rem]">
              <div>
                <span className="mb-2 block text-xs font-semibold uppercase text-[var(--color-text-secondary)]">Tipo</span>
                <div className="grid grid-cols-2 gap-2 rounded-[var(--radius-sm)] border border-white/10 bg-black/20 p-1">
                  <button type="button" className={segmentClass(mediaType === 'Movie')} onClick={() => changeMediaType('Movie')}>
                    Peliculas
                  </button>
                  <button type="button" className={segmentClass(mediaType === 'Series')} onClick={() => changeMediaType('Series')}>
                    Series
                  </button>
                </div>
              </div>

              <label className="text-sm text-[var(--color-text-secondary)]">
                Genero
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
              <p className="kicker">{mood ? 'Animo' : 'Resultados'}</p>
              <h2 className="mt-2 text-2xl font-semibold">{mood?.label ?? (mediaType === 'Movie' ? 'Peliculas encontradas' : 'Series encontradas')}</h2>
            </div>
          </div>
          {results.isLoading ? <LoadingSkeleton /> : null}
          {results.isError ? <ErrorState title="No pudimos cargar discovery" /> : null}
          {!results.isLoading && !results.isError && data.length === 0 ? (
            <EmptyState title="Sin resultados" message="Proba otro animo o toca Afinar para cambiar filtros." />
          ) : null}
          {!results.isLoading && !results.isError && data.length > 0 ? (
            <>
              <MediaGrid items={data} />
              <LoadMoreButton
                hasMore={Boolean(results.hasNextPage)}
                isLoading={results.isFetchingNextPage}
                onClick={() => void results.fetchNextPage()}
              />
            </>
          ) : null}
        </section>

        <QuickShelf title="Joyas modernas" items={gemsItems} viewAllHref="/movies/search?category=gems" />
        <QuickShelf title="Aclamadas por critica" items={criticPicks} viewAllHref="/movies/search?category=top-critics" />
        <QuickShelf title="El publico las ama" items={topRatedMovies.data?.items ?? []} viewAllHref="/movies/search?category=audience" />
        <QuickShelf title="Clasicos imprescindibles" items={classicsItems} viewAllHref="/movies/search?category=classics" />
      </main>
    </PublicLayout>
  )
}

function QuickShelf({ title, items, viewAllHref }: { title: string; items: MediaSummary[]; viewAllHref: string }) {
  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Coleccion Rewndly</p>
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

function pillClass(isActive: boolean) {
  return `min-h-10 shrink-0 rounded-[var(--radius-sm)] border px-3 text-sm font-semibold transition ${
    isActive
      ? 'border-violet-200/40 bg-[var(--color-accent)] text-white'
      : 'border-white/10 bg-white/[0.045] text-[var(--color-text-secondary)] hover:bg-white/[0.08] hover:text-white'
  }`
}

function segmentClass(isActive: boolean) {
  return `min-h-10 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition ${
    isActive ? 'bg-[var(--color-accent)] text-white' : 'text-[var(--color-text-secondary)] hover:bg-white/[0.06] hover:text-white'
  }`
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
