export const libraryRatingOptions = Array.from({ length: 91 }, (_, index) => {
  const value = (index + 10) / 10
  return value.toFixed(1)
})

export function parseLibraryRating(value: string) {
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

export function formatLibraryRating(value: number | null) {
  return value === null ? '' : value.toFixed(1)
}
