import { PosterCard } from '../PosterCard/PosterCard'
import type { RankedMediaSummary } from '../../../features/public-media/types/publicMedia.types'

type RankedMediaGridProps = {
  items: RankedMediaSummary[]
}

export function RankedMediaGrid({ items }: RankedMediaGridProps) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {items.map((item) => (
        <PosterCard key={`${item.media.mediaType}-${item.media.tmdbId}`} item={item.media} rankLabel={formatRankLabel(item)} />
      ))}
    </div>
  )
}

function formatRankLabel(item: RankedMediaSummary) {
  if (item.score !== null && item.scoreScale) {
    return `#${item.rank} ${item.source} ${formatScore(item.score, item.scoreScale)}`
  }

  return `#${item.rank} ${item.source}`
}

function formatScore(score: number, scale: number) {
  if (scale === 100) {
    return `${Math.round(score)}`
  }

  return `${score.toFixed(1)}`
}
