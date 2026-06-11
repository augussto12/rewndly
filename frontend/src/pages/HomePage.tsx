import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { HeroSection } from '../components/media/HeroSection/HeroSection'
import { MediaCarousel } from '../components/media/MediaCarousel/MediaCarousel'
import { useDiscoverMediaPages, useMovieRanking, usePublicHome, useTopRatedMovies } from '../features/public-media/hooks/usePublicMedia'
import type { MediaSummary, RankedMediaSummary } from '../features/public-media/types/publicMedia.types'
import { getMovieDiscoveryCollection } from '../features/public-media/utils/discoveryCollections'
import { flattenUniquePages } from '../lib/pagination'
import { PublicLayout } from '../layouts/PublicLayout'

export function HomePage() {
  const { data, isLoading, isError } = usePublicHome()
  const imdbRanking = useMovieRanking('imdb', !isLoading && !isError)
  const criticRanking = useMovieRanking('critics', !isLoading && !isError)
  const audienceMovies = useTopRatedMovies()
  const gemsCollection = getMovieDiscoveryCollection('gems')
  const gems = useDiscoverMediaPages(gemsCollection.filters ?? { mediaType: 'Movie' }, !isLoading && !isError)
  const heroItems = useMemo(
    () => [
      ...(data?.trendingMovies ?? []),
      ...(data?.nowPlayingMovies ?? []),
      ...(data?.popularMovies ?? []),
      ...(data?.trendingSeries ?? []),
      ...(data?.popularSeries ?? []),
    ],
    [data],
  )
  const imdbPicks = flattenUniquePages<RankedMediaSummary>(
    imdbRanking.data,
    (item) => `${item.media.mediaType}-${item.media.tmdbId}`,
  )
    .slice(0, 12)
  const criticPicks = flattenUniquePages<RankedMediaSummary>(
    criticRanking.data,
    (item) => `${item.media.mediaType}-${item.media.tmdbId}`,
  )
    .slice(0, 12)
  const imdbRankLabels = toRankLabelMap(imdbPicks)
  const criticRankLabels = toRankLabelMap(criticPicks)
  const gemsPicks = flattenUniquePages<MediaSummary>(gems.data, (item) => `${item.mediaType}-${item.tmdbId}`).slice(0, 12)
  const featureItems = (gemsPicks.length > 0 ? gemsPicks : data?.trendingMovies ?? []).slice(0, 5)

  return (
    <PublicLayout ambient="home">
      {isLoading ? (
        <HomeLoadingSkeleton />
      ) : null}

      {isError ? (
        <main className="page-shell">
          <ErrorState
            title="Catálogo público en espera"
            message="TMDB todavía no está configurado o no está disponible. La experiencia queda preparada para activarse sin mostrar errores técnicos."
          />
        </main>
      ) : null}

      {!isLoading && !isError && heroItems.length > 0 ? (
        <main>
          <HeroSection items={heroItems} />
          <div className="mx-auto max-w-[90rem] pb-12">
            {imdbPicks.length > 0 ? (
              <MediaCarousel
                kicker="Ranking IMDb"
                title="Mejor rating IMDb"
                items={imdbPicks.map((item) => item.media)}
                viewAllHref="/movies/search?category=top-imdb"
                rankLabels={imdbRankLabels}
              />
            ) : null}
            {criticPicks.length > 0 ? (
              <MediaCarousel
                kicker="Crítica"
                title="Mejor valoradas por crítica"
                items={criticPicks.map((item) => item.media)}
                viewAllHref="/movies/search?category=top-critics"
                rankLabels={criticRankLabels}
              />
            ) : null}
            <MediaCarousel kicker="Audiencia" title="Favoritas de audiencia" items={audienceMovies.data?.items ?? []} viewAllHref="/movies/search?category=audience" />
            <HomeFeatureGrid kicker="Curaduría" title="Joyas para descubrir" items={featureItems} viewAllHref="/movies/search?category=gems" />
            <MediaCarousel kicker="Series" title="Series en tendencia" items={data?.trendingSeries ?? []} viewAllHref="/series/search?category=trending" />
          </div>
        </main>
      ) : null}

      {!isLoading && !isError && heroItems.length === 0 ? (
        <main className="page-shell">
          <EmptyState title="Sin contenido para mostrar" message="Cuando TMDB devuelva resultados, van a aparecer acá con pósters, backdrops y carousels." />
        </main>
      ) : null}
    </PublicLayout>
  )
}

function HomeLoadingSkeleton() {
  return (
    <main className="animate-pulse">
      <section className="relative min-h-[68svh] overflow-hidden bg-black/36">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#09090b_0%,rgba(9,9,11,0.88)_42%,rgba(9,9,11,0.44)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-background)] to-transparent" />
        <div className="relative mx-auto flex min-h-[68svh] max-w-[90rem] flex-col justify-end px-4 pb-10 pt-24 sm:px-6">
          <div className="max-w-2xl">
            <div className="mb-5 flex gap-3">
              <span className="h-8 w-36 rounded-[var(--radius-sm)] bg-white/[0.08]" />
              <span className="h-8 w-16 rounded-[var(--radius-sm)] bg-white/[0.06]" />
            </div>
            <div className="h-14 max-w-xl rounded-[var(--radius-sm)] bg-white/[0.08] sm:h-16" />
            <div className="mt-5 grid max-w-xl gap-3">
              <span className="h-4 rounded-full bg-white/[0.07]" />
              <span className="h-4 w-11/12 rounded-full bg-white/[0.055]" />
              <span className="h-4 w-3/4 rounded-full bg-white/[0.045]" />
            </div>
            <div className="mt-7 flex gap-3">
              <span className="h-11 w-28 rounded-[var(--radius-sm)] bg-white/[0.08]" />
              <span className="h-11 w-32 rounded-[var(--radius-sm)] bg-white/[0.055]" />
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[90rem] px-4 py-8 sm:px-6">
        <div className="mb-5 h-7 w-56 rounded-[var(--radius-sm)] bg-white/[0.08]" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="aspect-[2/3] rounded-[var(--radius-md)] border border-white/[0.08] bg-white/[0.045]" />
          ))}
        </div>
      </section>
    </main>
  )
}

function HomeFeatureGrid({
  kicker,
  title,
  items,
  viewAllHref,
}: {
  kicker: string
  title: string
  items: MediaSummary[]
  viewAllHref: string
}) {
  const [featured, ...secondaryItems] = items.slice(0, 5)

  if (!featured) {
    return null
  }

  const featuredVisual = featured.backdropUrl ?? featured.posterUrl

  return (
    <section className="px-4 py-8 sm:px-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="kicker">{kicker}</p>
          <h2 className="mt-2 text-xl font-semibold">{title}</h2>
        </div>
        <Link to={viewAllHref} className="secondary-action min-h-9 px-3 py-2 text-xs">
          Ver todo
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <Link
          to={getMediaHref(featured)}
          className="group relative min-h-[22rem] overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-white/[0.045] transition hover:border-violet-200/35"
        >
          {featuredVisual ? (
            <img src={featuredVisual} alt="" className="absolute inset-0 h-full w-full object-cover opacity-50 transition duration-500 group-hover:scale-[1.025] group-hover:opacity-60" loading="lazy" />
          ) : null}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.08)_0%,rgba(9,9,11,0.76)_56%,rgba(9,9,11,0.96)_100%)]" />
          <div className="relative flex min-h-[22rem] flex-col justify-end p-5 sm:p-6">
            <span className="w-fit rounded-[var(--radius-sm)] border border-violet-200/20 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-100">
              Hallazgo
            </span>
            <h3 className="mt-4 max-w-2xl text-3xl font-semibold leading-tight text-white sm:text-4xl">{featured.title}</h3>
            <p className="mt-3 line-clamp-3 max-w-2xl text-sm leading-6 text-[var(--color-text-secondary)]">
              {featured.overview || 'Una recomendación para salir del piloto automático.'}
            </p>
            <p className="mt-4 text-xs uppercase tracking-[0.12em] text-violet-100/80">{getMediaMeta(featured)}</p>
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          {secondaryItems.map((item) => (
            <Link
              key={`${item.mediaType}-${item.tmdbId}`}
              to={getMediaHref(item)}
              className="group grid min-h-36 grid-cols-[4.75rem_minmax(0,1fr)] gap-3 rounded-[var(--radius-md)] border border-white/10 bg-white/[0.04] p-3 transition hover:border-violet-200/30 hover:bg-white/[0.065]"
            >
              <span className="aspect-[2/3] overflow-hidden rounded-[var(--radius-sm)] bg-white/[0.06]">
                {item.posterUrl ? <img src={item.posterUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" /> : null}
              </span>
              <span className="min-w-0 self-end">
                <span className="line-clamp-2 text-sm font-semibold leading-5 text-white">{item.title}</span>
                <span className="mt-2 block text-xs text-[var(--color-text-secondary)]">{getMediaMeta(item)}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

function toRankLabelMap(items: RankedMediaSummary[]) {
  return new Map(items.map((item) => [`${item.media.mediaType}-${item.media.tmdbId}`, formatRankLabel(item)]))
}

function formatRankLabel(item: RankedMediaSummary) {
  if (item.score !== null && item.scoreScale) {
    return `${item.source} ${formatScore(item.score, item.scoreScale)}`
  }

  return `#${item.rank} ${item.source}`
}

function formatScore(score: number, scale: number) {
  if (scale === 100) {
    return `${Math.round(score)}`
  }

  return `${score.toFixed(1)}`
}

function getMediaHref(item: MediaSummary) {
  return item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
}

function getMediaMeta(item: MediaSummary) {
  return [item.mediaType === 'Movie' ? 'Película' : 'Serie', item.releaseDate?.slice(0, 4), item.voteAverage ? `${item.voteAverage.toFixed(1)}/10` : null]
    .filter(Boolean)
    .join(' / ')
}
