import { useMemo } from 'react'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
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

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState
            title="Catalogo publico en espera"
            message="TMDB todavia no esta configurado o no esta disponible. La experiencia queda preparada para activarse sin mostrar errores tecnicos."
          />
        </main>
      ) : null}

      {!isLoading && !isError && heroItems.length > 0 ? (
        <main>
          <HeroSection items={heroItems} />
          <div className="mx-auto max-w-7xl pb-12">
            {imdbPicks.length > 0 ? (
              <MediaCarousel
                title="Mejor rating IMDb"
                items={imdbPicks.map((item) => item.media)}
                viewAllHref="/movies/search?category=top-imdb"
                rankLabels={imdbRankLabels}
              />
            ) : null}
            {criticPicks.length > 0 ? (
              <MediaCarousel
                title="Mejor valoradas por critica"
                items={criticPicks.map((item) => item.media)}
                viewAllHref="/movies/search?category=top-critics"
                rankLabels={criticRankLabels}
              />
            ) : null}
            <MediaCarousel title="Favoritas de audiencia" items={audienceMovies.data?.items ?? []} viewAllHref="/movies/search?category=audience" />
            <MediaCarousel title="Joyas para descubrir" items={gemsPicks.length > 0 ? gemsPicks : data?.trendingMovies ?? []} viewAllHref="/movies/search?category=gems" />
            <MediaCarousel title="Series en tendencia" items={data?.trendingSeries ?? []} viewAllHref="/series/search?category=trending" />
          </div>
        </main>
      ) : null}

      {!isLoading && !isError && heroItems.length === 0 ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EmptyState title="Sin contenido para mostrar" message="Cuando TMDB devuelva resultados, apareceran aca con posters, backdrops y carousels." />
        </main>
      ) : null}
    </PublicLayout>
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
