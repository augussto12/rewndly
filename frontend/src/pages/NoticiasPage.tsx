import { EmptyState } from '../components/feedback/EmptyState/EmptyState'
import { ErrorState } from '../components/feedback/ErrorState/ErrorState'
import { useNews } from '../features/public-media/hooks/usePublicMedia'
import type { NewsArticle } from '../features/public-media/types/publicMedia.types'
import { PublicLayout } from '../layouts/PublicLayout'
import { timeAgo } from '../lib/date'
import { safeExternalUrl } from '../lib/safeExternalUrl'

export function NoticiasPage() {
  const { data, isLoading, isError, refetch } = useNews(36)
  const articles = data?.articles ?? []

  return (
    <PublicLayout ambient="catalog">
      <main className="page-shell">
        <header className="max-w-2xl">
          <p className="kicker">Actualidad</p>
          <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Noticias</h1>
          <p className="mt-4 text-[var(--color-text-secondary)]">
            Lo último del cine y las series, reunido de los medios especializados. Tocá una nota para leerla en su fuente.
          </p>
        </header>

        <section className="mt-10">
          {isLoading ? <NewsSkeleton /> : null}
          {isError ? (
            <ErrorState
              action={
                <button type="button" onClick={() => void refetch()} className="secondary-action">
                  Reintentar
                </button>
              }
            />
          ) : null}
          {!isLoading && !isError && articles.length === 0 ? (
            <EmptyState title="Sin noticias" message="No pudimos traer noticias por ahora. Probá de nuevo en un rato." />
          ) : null}

          {!isLoading && !isError && articles.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <NewsCard key={article.url} article={article} />
              ))}
            </div>
          ) : null}
        </section>
      </main>
    </PublicLayout>
  )
}

function NewsSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface)]">
          <div className="aspect-video animate-pulse bg-white/[0.05]" />
          <div className="space-y-3 p-4">
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
          </div>
        </div>
      ))}
    </div>
  )
}

function NewsCard({ article }: { article: NewsArticle }) {
  const href = safeExternalUrl(article.url)
  if (!href) {
    return null
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-[var(--color-surface)] shadow-[var(--shadow-soft)] transition hover:-translate-y-1 hover:border-violet-200/28"
    >
      <div className="aspect-video overflow-hidden bg-[var(--color-surface-elevated)]">
        {article.imageUrl ? (
          <img
            src={article.imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.045]"
          />
        ) : (
          <div className="grid h-full place-items-center text-sm text-[var(--color-text-secondary)]">{article.source}</div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 font-medium text-violet-100">
            {article.source}
          </span>
          {article.publishedAt ? <span>{timeAgo(article.publishedAt)}</span> : null}
        </div>
        <h2 className="mt-3 line-clamp-3 text-base font-semibold leading-snug text-white">{article.title}</h2>
        {article.summary ? (
          <p className="mt-2 line-clamp-2 text-sm text-[var(--color-text-secondary)]">{article.summary}</p>
        ) : null}
      </div>
    </a>
  )
}
