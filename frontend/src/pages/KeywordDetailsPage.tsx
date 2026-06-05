import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton/LoadingSkeleton'
import { MediaGrid } from '../components/media/MediaGrid/MediaGrid'
import { useKeywordDetails } from '../features/public-media/hooks/usePublicMedia'
import { PublicLayout } from '../layouts/PublicLayout'

type KeywordTab = 'movies' | 'series'

export function KeywordDetailsPage() {
  const keywordId = Number(useParams().keywordId)
  const { data, isError, isLoading } = useKeywordDetails(keywordId)
  const tabs = useMemo(
    () =>
      data
        ? [
            { id: 'movies' as const, label: 'Peliculas', enabled: data.movies.length > 0 },
            { id: 'series' as const, label: 'Series', enabled: data.series.length > 0 },
          ].filter((tab) => tab.enabled)
        : [],
    [data],
  )
  const [activeTab, setActiveTab] = useState<KeywordTab>('movies')
  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0]?.id ?? 'movies'

  return (
    <PublicLayout>
      {isLoading ? (
        <main className="page-shell">
          <LoadingSkeleton />
        </main>
      ) : null}

      {isError || !Number.isFinite(keywordId) ? (
        <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
          <ErrorState title="No pudimos cargar la keyword" />
        </main>
      ) : null}

      {!isLoading && !isError && data ? (
        <main className="page-shell">
          <section>
            <p className="kicker">Keyword</p>
            <h1 className="mt-3 text-4xl font-semibold leading-tight sm:text-6xl">{data.name}</h1>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/discover" className="secondary-action">
                Explorar catalogo
              </Link>
            </div>
          </section>

          <section className="surface-panel overflow-hidden">
            <div className="border-b border-white/10 p-4 sm:p-5">
              <p className="kicker">Resultados</p>
              <div className="scrollbar-cinema mt-4 flex gap-2 overflow-x-auto pb-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 rounded-[var(--radius-sm)] px-3 py-2 text-sm font-semibold transition ${
                      selectedTab === tab.id
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-white/[0.045] text-[var(--color-text-secondary)] hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 sm:p-5">
              {tabs.length === 0 ? <EmptyState title="Sin resultados" message="TMDB no devolvio contenido para esta keyword." /> : null}
              {selectedTab === 'movies' ? <MediaGrid items={data.movies} /> : null}
              {selectedTab === 'series' ? <MediaGrid items={data.series} /> : null}
            </div>
          </section>
        </main>
      ) : null}
    </PublicLayout>
  )
}
