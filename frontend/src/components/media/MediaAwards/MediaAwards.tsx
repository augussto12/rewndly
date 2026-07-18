import { useMediaAwards } from '../../../features/public-media/hooks/usePublicMedia'
import { AwardsSection } from '../AwardsSection/AwardsSection'

type MediaAwardsProps = {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
}

/** Sección de premios autocontenida para las fichas de película/serie. Se oculta si no hay. */
export function MediaAwards({ mediaType, tmdbId }: MediaAwardsProps) {
  const { data } = useMediaAwards(mediaType, tmdbId)

  if (!data?.available || data.awards.length === 0) {
    return null
  }

  return <AwardsSection awards={data.awards} wikidataId={data.wikidataId} />
}
