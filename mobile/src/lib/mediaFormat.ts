import type { MediaVideo } from '../api/types'

export function formatRuntime(minutes: number | null) {
  if (!minutes) {
    return ''
  }

  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) {
    return `${rest} min`
  }

  return rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
}

export function pickTrailer(videos: MediaVideo[] | undefined): MediaVideo | undefined {
  if (!videos?.length) {
    return undefined
  }

  const youtube = videos.filter((video) => video.site.toLowerCase() === 'youtube')
  const pool = youtube.length ? youtube : videos
  return (
    pool.find((video) => video.type.toLowerCase() === 'trailer' && video.official) ??
    pool.find((video) => video.type.toLowerCase() === 'trailer') ??
    pool[0]
  )
}
