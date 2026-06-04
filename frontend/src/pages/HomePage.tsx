import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { HeroSection } from '../components/media/HeroSection/HeroSection'
import { MediaCarousel } from '../components/media/MediaCarousel/MediaCarousel'
import { usePublicHome } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

export function HomePage() {
  const { data, isLoading, isError } = usePublicHome()
  const heroItem = data?.trendingMovies[0] ?? data?.trendingSeries[0] ?? data?.popularMovies[0]

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

      {!isLoading && !isError && heroItem ? (
        <main>
          <HeroSection item={heroItem} />
          <div className="mx-auto max-w-7xl pb-12">
            <MediaCarousel title="Peliculas en tendencia" items={data?.trendingMovies ?? []} />
            <MediaCarousel title="Peliculas en cartelera" items={data?.nowPlayingMovies ?? []} />
            <MediaCarousel title="Peliculas populares" items={data?.popularMovies ?? []} />
            <MediaCarousel title="Proximos estrenos" items={data?.upcomingMovies ?? []} />
            <MediaCarousel title="Series en tendencia" items={data?.trendingSeries ?? []} />
            <MediaCarousel title="Series populares" items={data?.popularSeries ?? []} />
          </div>
        </main>
      ) : null}

      {!isLoading && !isError && !heroItem ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <EmptyState title="Sin contenido para mostrar" message="Cuando TMDB devuelva resultados, apareceran aca con posters, backdrops y carousels." />
        </main>
      ) : null}
    </PublicLayout>
  )
}
