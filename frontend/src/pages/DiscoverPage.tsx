import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import {
  useAiringTodaySeries,
  useDiscoverMediaPages,
  useDiscoverOptions,
  useOnTheAirSeries,
  useTopRatedMovies,
  useTopRatedSeries,
} from '../features/public-media/hooks/usePublicMedia'
import type { DiscoverFilters } from '../features/public-media/types/publicMedia.types'
import type { MediaSummary } from '../features/public-media/types/publicMedia.types'
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
  const [mediaType, setMediaType] = useState<'Movie' | 'Series'>('Movie')
  const [genreId, setGenreId] = useState('')
  const [year, setYear] = useState('')
  const [watchProviderId, setWatchProviderId] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')
  const [minVoteAverage, setMinVoteAverage] = useState('0')

  const filters = useMemo<DiscoverFilters>(
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

  const results = useDiscoverMediaPages(filters)
  const data = flattenUniquePages<MediaSummary>(results.data, (item) => `${item.mediaType}-${item.tmdbId}`)
  const { genres, watchProviders } = useDiscoverOptions(mediaType)
  const topRatedMovies = useTopRatedMovies()
  const topRatedSeries = useTopRatedSeries()
  const airingToday = useAiringTodaySeries()
  const onTheAir = useOnTheAirSeries()
  const sortOptions = mediaType === 'Movie' ? movieSortOptions : seriesSortOptions

  function changeMediaType(value: 'Movie' | 'Series') {
    setMediaType(value)
    setGenreId('')
    setWatchProviderId('')
    setSortBy('popularity.desc')
  }

  return (
    <PublicLayout>
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Explorar</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Descubrir catalogo</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Filtra peliculas y series por genero, ano, proveedor, rating y tendencia para encontrar algo sin depender de una busqueda exacta.
          </p>
        </header>

        <section className="surface-panel mt-8 p-4 sm:p-5">
          <div className="grid gap-4 lg:grid-cols-[auto_1fr_1fr_1fr_1fr_12rem]">
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
              <select value={genreId} onChange={(event) => setGenreId(event.target.value)} className="field mt-2">
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
              <select value={watchProviderId} onChange={(event) => setWatchProviderId(event.target.value)} className="field mt-2">
                <option value="">Todos</option>
                {watchProviders.data?.map((provider) => (
                  <option key={provider.providerId} value={provider.providerId}>
                    {provider.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm text-[var(--color-text-secondary)]">
              Ano
              <input
                value={year}
                onChange={(event) => setYear(event.target.value)}
                type="number"
                min="1900"
                max="2100"
                placeholder="Todos"
                className="field mt-2"
              />
            </label>

            <label className="text-sm text-[var(--color-text-secondary)]">
              Orden
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="field mt-2">
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
                onChange={(event) => setMinVoteAverage(event.target.value)}
                type="number"
                min="0"
                max="10"
                step="0.5"
                className="field mt-2"
              />
            </label>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Resultados</p>
              <h2 className="mt-2 text-2xl font-semibold">{mediaType === 'Movie' ? 'Peliculas encontradas' : 'Series encontradas'}</h2>
            </div>
          </div>
          {results.isLoading ? <LoadingSkeleton /> : null}
          {results.isError ? <ErrorState title="No pudimos cargar discovery" /> : null}
          {!results.isLoading && !results.isError && data.length === 0 ? (
            <EmptyState title="Sin resultados" message="Proba cambiar filtros o bajar el rating minimo." />
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

        {mediaType === 'Movie' ? (
          <QuickShelf
            title="Peliculas mejor valoradas"
            items={topRatedMovies.data?.items ?? []}
            isLoading={topRatedMovies.isLoading}
            viewAllHref="/movies/search?category=top-rated"
          />
        ) : (
          <>
            <QuickShelf
              title="Series mejor valoradas"
              items={topRatedSeries.data?.items ?? []}
              isLoading={topRatedSeries.isLoading}
              viewAllHref="/series/search?category=top-rated"
            />
            <QuickShelf
              title="Series que se emiten hoy"
              items={airingToday.data?.items ?? []}
              isLoading={airingToday.isLoading}
              viewAllHref="/series/search?category=airing-today"
            />
            <QuickShelf
              title="Series al aire"
              items={onTheAir.data?.items ?? []}
              isLoading={onTheAir.isLoading}
              viewAllHref="/series/search?category=on-the-air"
            />
          </>
        )}
      </main>
    </PublicLayout>
  )
}

function QuickShelf({ title, items, isLoading, viewAllHref }: { title: string; items: MediaSummary[]; isLoading: boolean; viewAllHref: string }) {
  if (isLoading) {
    return null
  }

  if (items.length === 0) {
    return null
  }

  return (
    <section className="mt-12">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="kicker">Listas</p>
          <h2 className="mt-2 text-2xl font-semibold">{title}</h2>
        </div>
        <Link to={viewAllHref} className="secondary-action min-h-9 px-3 py-2 text-xs">
          Ver todo
        </Link>
      </div>
      <div>
        <MediaGrid items={items.slice(0, 12)} />
      </div>
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
