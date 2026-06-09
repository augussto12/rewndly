import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { RatingBadge } from '../RatingBadge/RatingBadge'
import type { MediaSummary } from '../../../features/public-media/types/publicMedia.types'

type HeroSectionProps = {
  items: MediaSummary[]
}

export function HeroSection({ items }: HeroSectionProps) {
  const featuredItems = useMemo(() => getFeaturedItems(items), [items])
  const [activeIndex, setActiveIndex] = useState(0)
  const normalizedIndex = featuredItems.length > 0 ? activeIndex % featuredItems.length : 0
  const item = featuredItems[normalizedIndex] ?? featuredItems[0]
  const canNavigate = featuredItems.length > 1

  useEffect(() => {
    if (!canNavigate) {
      return
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % featuredItems.length)
    }, 6500)

    return () => window.clearInterval(timer)
  }, [canNavigate, featuredItems.length])

  if (!item) {
    return null
  }

  const href = item.mediaType === 'Movie' ? `/movies/${item.tmdbId}` : `/series/${item.tmdbId}`
  const releaseYear = item.releaseDate?.slice(0, 4)

  function goPrevious() {
    setActiveIndex((index) => (index - 1 + featuredItems.length) % featuredItems.length)
  }

  function goNext() {
    setActiveIndex((index) => (index + 1) % featuredItems.length)
  }

  return (
    <section className="relative min-h-[72svh] overflow-hidden">
      <div className="absolute inset-0 bg-black">
        {featuredItems.map((featured, index) =>
          featured.backdropUrl ? (
            <img
              key={`${featured.mediaType}-${featured.tmdbId}`}
              src={featured.backdropUrl}
              alt=""
              className={`absolute inset-0 h-full w-full object-cover transition duration-700 ${
                index === normalizedIndex ? 'scale-100 opacity-[0.56]' : 'scale-[1.025] opacity-0'
              }`}
            />
          ) : null,
        )}
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,#09090b_0%,rgba(9,9,11,0.9)_34%,rgba(9,9,11,0.32)_74%,rgba(9,9,11,0.64)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,9,11,0.1)_0%,rgba(9,9,11,0.08)_52%,rgba(16,34,54,0.98)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[var(--color-background)] to-transparent" />

      {canNavigate ? (
        <>
          <button
            type="button"
            onClick={goPrevious}
            className="absolute left-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/28 text-lg font-semibold text-white/74 shadow-[0_14px_34px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-violet-100/35 hover:bg-white/12 hover:text-white sm:grid"
            aria-label="Anterior destacado"
          >
            <span aria-hidden="true">&lt;</span>
          </button>
          <button
            type="button"
            onClick={goNext}
            className="absolute right-4 top-1/2 z-10 hidden h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/10 bg-black/28 text-lg font-semibold text-white/74 shadow-[0_14px_34px_rgba(0,0,0,0.28)] backdrop-blur transition hover:border-violet-100/35 hover:bg-white/12 hover:text-white sm:grid"
            aria-label="Siguiente destacado"
          >
            <span aria-hidden="true">&gt;</span>
          </button>
        </>
      ) : null}

      <div className="relative mx-auto flex min-h-[72svh] max-w-7xl flex-col justify-end px-4 pb-9 pt-24 sm:px-6 lg:pb-11">
        <div className="max-w-2xl">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-[var(--radius-sm)] border border-violet-200/20 bg-[var(--color-accent-soft)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-violet-100">
              {activeIndex === 0 ? 'Tendencia' : 'Destacada'}
            </span>
            <RatingBadge value={item.voteAverage} />
            <span className="text-xs uppercase tracking-[0.12em] text-[var(--color-text-secondary)]">
              {[item.mediaType === 'Movie' ? 'Pelicula' : 'Serie', releaseYear].filter(Boolean).join(' / ')}
            </span>
          </div>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-6xl">{item.title}</h1>
          <p className="mt-5 line-clamp-4 max-w-xl text-base leading-7 text-[var(--color-text-secondary)]">
            {item.overview || 'Una pieza destacada para empezar a explorar el catalogo.'}
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to={href} className="primary-action">
              Ver detalle
            </Link>
            <Link to={item.mediaType === 'Movie' ? '/movies/search?category=trending' : '/series/search?category=trending'} className="secondary-action">
              Explorar mas
            </Link>
          </div>
        </div>

        {canNavigate ? (
          <div className="mx-auto mt-8 flex w-fit items-center gap-3 rounded-full border border-white/10 bg-black/24 px-2 py-2 shadow-[0_14px_34px_rgba(0,0,0,0.22)] backdrop-blur">
            <button
              type="button"
              onClick={goPrevious}
              className="grid h-9 w-9 place-items-center rounded-full text-base font-semibold text-white/74 transition hover:bg-white/10 hover:text-white sm:hidden"
              aria-label="Anterior destacado"
            >
              <span aria-hidden="true">&lt;</span>
            </button>
            {featuredItems.slice(0, 5).map((featured, index) => (
              <button
                key={`${featured.mediaType}-${featured.tmdbId}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Ver destacado ${index + 1}`}
                className={`h-2.5 rounded-full transition ${index === normalizedIndex ? 'w-8 bg-violet-200' : 'w-2.5 bg-white/32'}`}
              />
            ))}
            <button
              type="button"
              onClick={goNext}
              className="grid h-9 w-9 place-items-center rounded-full text-base font-semibold text-white/74 transition hover:bg-white/10 hover:text-white sm:hidden"
              aria-label="Siguiente destacado"
            >
              <span aria-hidden="true">&gt;</span>
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function getFeaturedItems(items: MediaSummary[]) {
  const seen = new Set<string>()

  return items
    .filter((item) => item.backdropUrl)
    .filter((item) => {
      const key = `${item.mediaType}-${item.tmdbId}`
      if (seen.has(key)) {
        return false
      }

      seen.add(key)
      return true
    })
    .slice(0, 8)
}
