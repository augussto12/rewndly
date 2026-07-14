import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { MediaGridSkeleton } from '../components/feedback/GridSkeleton/GridSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { PaginationFooter } from '../components/ui/PaginationFooter'
import { useClientPagination } from '../components/ui/useClientPagination'
import { useBestMoviesOfYear } from '../features/public-media/hooks/useBestMoviesOfYear'
import { useLibraryRecommendations } from '../features/public-media/hooks/useLibraryRecommendations'
import { PublicLayout } from '../layouts/PublicLayout'

export function RecommendationsPage() {
  const recs = useLibraryRecommendations(48)
  const recsPager = useClientPagination(recs.recommendations, 12)

  const currentYear = new Date().getFullYear()
  const yearOptions = useMemo(() => Array.from({ length: currentYear - 1969 }, (_, index) => currentYear - index), [currentYear])
  const [bestYear, setBestYear] = useState(currentYear)
  const bestOfYear = useBestMoviesOfYear(bestYear, 24)
  const yearPager = useClientPagination(bestOfYear.items, 12)

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="max-w-3xl">
          <p className="kicker">Para vos</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Recomendaciones</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Cruzadas con tu biblioteca y con lo mejor valorado por IMDb y Rotten Tomatoes.
          </p>
        </header>

        <section className="mt-10">
          <div className="mb-6">
            <p className="kicker">Según tu biblioteca</p>
            <h2 className="mt-2 text-2xl font-semibold">Recomendado para vos</h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">A partir de tus favoritas y mejor puntuadas, ordenado por IMDb y Rotten Tomatoes.</p>
          </div>
          {!recs.isAuthenticated ? (
            <EmptyState
              title="Iniciá sesión"
              message="Entrá a tu cuenta para ver recomendaciones según tu biblioteca."
              action={
                <Link to="/login" className="primary-action">
                  Iniciar sesión
                </Link>
              }
            />
          ) : recs.isLoading ? (
            <MediaGridSkeleton />
          ) : recs.recommendations.length > 0 ? (
            <>
              <MediaGrid items={recsPager.pagedItems} />
              <PaginationFooter pager={recsPager} unit="películas" />
            </>
          ) : (
            <EmptyState
              title="Todavía sin recomendaciones"
              message="Marcá algunas pelis como vistas o favoritas y vas a ver sugerencias personalizadas acá."
              action={
                <Link to="/discover" className="primary-action">
                  Explorar catálogo
                </Link>
              }
            />
          )}
        </section>

        <section className="mt-14">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="kicker">Ranking</p>
              <h2 className="mt-2 text-2xl font-semibold">Mejores películas del año</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Las mejor valoradas por IMDb y Rotten Tomatoes en cada año.</p>
            </div>
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
          </div>
          {bestOfYear.isLoading ? (
            <MediaGridSkeleton />
          ) : bestOfYear.items.length > 0 ? (
            <>
              <MediaGrid items={yearPager.pagedItems} />
              <PaginationFooter pager={yearPager} unit="películas" />
            </>
          ) : (
            <EmptyState title="Sin resultados" message="No encontramos películas para ese año." />
          )}
        </section>
      </main>
    </PublicLayout>
  )
}
