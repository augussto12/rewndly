import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FilterChip } from '../../filters/FilterChip'
import { safeExternalUrl } from '../../../lib/safeExternalUrl'
import type {
  MediaAlternativeTitle,
  MediaExternalLink,
  MediaImage,
  MediaKeyword,
  MediaReview,
  MediaTranslation,
  MovieReleaseInfo,
  SeriesContentRating,
} from '../../../features/public-media/types/publicMedia.types'
import { formatCountryName, translateTmdbLabel } from '../../../features/public-media/utils/tmdbLabels'

type MediaDetailsMetadataProps = {
  images: MediaImage[]
  keywords: MediaKeyword[]
  reviews: MediaReview[]
  externalLinks: MediaExternalLink[]
  alternativeTitles: MediaAlternativeTitle[]
  translations: MediaTranslation[]
  releaseInfo?: MovieReleaseInfo[]
  contentRatings?: SeriesContentRating[]
}

type TabId = 'facts' | 'images' | 'reviews' | 'localization'

export function MediaDetailsMetadata({
  images,
  keywords,
  reviews,
  externalLinks,
  alternativeTitles,
  translations,
  releaseInfo = [],
  contentRatings = [],
}: MediaDetailsMetadataProps) {
  const tabs = useMemo(
    () =>
      [
        { id: 'facts' as const, label: 'Ficha', enabled: keywords.length > 0 || externalLinks.length > 0 || releaseInfo.length > 0 || contentRatings.length > 0 },
        { id: 'images' as const, label: 'Imágenes', enabled: images.length > 0 },
        { id: 'reviews' as const, label: 'Reseñas TMDB', enabled: reviews.length > 0 },
        { id: 'localization' as const, label: 'Títulos e idiomas', enabled: alternativeTitles.length > 0 || translations.length > 0 },
      ].filter((tab) => tab.enabled),
    [alternativeTitles.length, contentRatings.length, externalLinks.length, images.length, keywords.length, releaseInfo.length, reviews.length, translations.length],
  )
  const [activeTab, setActiveTab] = useState<TabId>(tabs[0]?.id ?? 'facts')

  if (tabs.length === 0) {
    return null
  }

  const selectedTab = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id

  return (
    <section className="mx-auto max-w-[90rem] px-4 pb-16 sm:px-6">
      <div className="surface-panel overflow-hidden">
        <div className="border-b border-white/10 p-4 sm:p-5">
          <p className="kicker">Ficha extendida</p>
          <div className="scrollbar-cinema mt-4 flex gap-2 overflow-x-auto pb-1">
            {tabs.map((tab) => (
              <FilterChip
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                active={selectedTab === tab.id}
              >
                {tab.label}
              </FilterChip>
            ))}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          {selectedTab === 'facts' ? (
            <FactsTab keywords={keywords} externalLinks={externalLinks} releaseInfo={releaseInfo} contentRatings={contentRatings} />
          ) : null}
          {selectedTab === 'images' ? <ImagesTab images={images} /> : null}
          {selectedTab === 'reviews' ? <ReviewsTab reviews={reviews} /> : null}
          {selectedTab === 'localization' ? (
            <LocalizationTab alternativeTitles={alternativeTitles} translations={translations} />
          ) : null}
        </div>
      </div>
    </section>
  )
}

function FactsTab({
  keywords,
  externalLinks,
  releaseInfo,
  contentRatings,
}: {
  keywords: MediaKeyword[]
  externalLinks: MediaExternalLink[]
  releaseInfo: MovieReleaseInfo[]
  contentRatings: SeriesContentRating[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <h3 className="text-base font-semibold">Palabras clave</h3>
        {keywords.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {keywords.map((keyword) => (
              <Link key={keyword.tmdbId} to={`/keywords/${keyword.tmdbId}`} className="rounded-[var(--radius-sm)] border border-white/10 bg-white/[0.045] px-3 py-1 text-xs text-violet-100 transition hover:border-violet-200/35 hover:bg-white/[0.08]">
                {keyword.name}
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Sin palabras clave disponibles.</p>
        )}
      </div>

      <div>
        <h3 className="text-base font-semibold">Enlaces externos</h3>
        {externalLinks.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {externalLinks.map((link) => {
              const href = safeExternalUrl(link.url)
              return href ? (
                <a key={`${link.site}-${link.id}`} href={href} target="_blank" rel="noreferrer" className="secondary-action min-h-10">
                  {link.site}
                </a>
              ) : null
            })}
          </div>
        ) : (
          <p className="mt-3 text-sm text-[var(--color-text-secondary)]">Sin links externos disponibles.</p>
        )}
      </div>

      {releaseInfo.length > 0 ? (
        <InfoTable
          title="Estrenos y clasificaciones"
          rows={releaseInfo.slice(0, 10).map((item) => [
            formatCountryName(item.country),
            item.certification || 'Sin clasificación',
            item.releaseDate ? item.releaseDate.slice(0, 10) : 'Sin fecha',
          ])}
        />
      ) : null}

      {contentRatings.length > 0 ? (
        <InfoTable title="Clasificaciones por país" rows={contentRatings.slice(0, 10).map((item) => [formatCountryName(item.country), item.rating])} />
      ) : null}
    </div>
  )
}

function ImagesTab({ images }: { images: MediaImage[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image) => (
        <a key={image.url} href={image.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${translateTmdbLabel(image.type)} en tamaño completo`} className="group block overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/30">
          <div className={image.type === 'Poster' ? 'aspect-[2/3]' : 'aspect-video'}>
            <img src={image.url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" loading="lazy" />
          </div>
          <div className="flex items-center justify-between px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            <span>{translateTmdbLabel(image.type)}</span>
            <span>{image.width && image.height ? `${image.width} x ${image.height}` : ''}</span>
          </div>
        </a>
      ))}
    </div>
  )
}

function ReviewsTab({ reviews }: { reviews: MediaReview[] }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-[var(--radius-md)] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-3">
            {review.avatarUrl ? <img src={review.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" loading="lazy" /> : null}
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold">{review.author}</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {[review.username ? `@${review.username}` : '', review.rating ? `${review.rating}/10` : '', review.createdAt ? review.createdAt.slice(0, 10) : '']
                  .filter(Boolean)
                  .join(' / ')}
              </p>
            </div>
          </div>
          <p className="mt-4 line-clamp-6 text-sm leading-6 text-[var(--color-text-secondary)]">{review.content}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link to={`/tmdb-reviews/${encodeURIComponent(review.id)}`} className="text-sm font-semibold text-violet-200 underline-offset-4 hover:underline">
              Leer review completa
            </Link>
            {safeExternalUrl(review.url) ? (
              <a href={safeExternalUrl(review.url) ?? undefined} target="_blank" rel="noreferrer" className="text-sm font-semibold text-violet-200 underline-offset-4 hover:underline">
                Ver en TMDB
              </a>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  )
}

function LocalizationTab({
  alternativeTitles,
  translations,
}: {
  alternativeTitles: MediaAlternativeTitle[]
  translations: MediaTranslation[]
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {alternativeTitles.length > 0 ? (
        <InfoTable
          title="Títulos alternativos"
          rows={alternativeTitles.slice(0, 12).map((title) => [title.title, formatCountryName(title.country), title.type || ''])}
        />
      ) : null}
      {translations.length > 0 ? (
        <InfoTable
          title="Traducciones"
          rows={translations.slice(0, 16).map((translation) => [
            [translation.languageCode, translation.countryCode].filter(Boolean).join('-'),
            translation.englishName || '',
            translation.name || '',
          ])}
        />
      ) : null}
    </div>
  )
}

function InfoTable({ title, rows }: { title: string; rows: string[][] }) {
  return (
    <div>
      <h3 className="text-base font-semibold">{title}</h3>
      <div className="mt-3 overflow-hidden rounded-[var(--radius-md)] border border-white/10">
        {rows.map((row, index) => (
          <div key={`${title}-${index}`} className="grid gap-2 border-t border-white/10 px-3 py-2 text-sm first:border-t-0 sm:grid-cols-3">
            {row.map((cell, cellIndex) => (
              <span key={`${title}-${index}-${cellIndex}`} className={`min-w-0 break-words ${cellIndex === 0 ? 'font-medium text-white' : 'text-[var(--color-text-secondary)]'}`}>
                {cell}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
