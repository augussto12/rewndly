export type LoadablePages<TItem> = {
  pages: Array<{
    items: TItem[]
  }>
}

export function flattenUniquePages<TItem>(data: LoadablePages<TItem> | undefined, getKey: (item: TItem) => string) {
  const seen = new Set<string>()
  const items: TItem[] = []

  data?.pages.forEach((page) => {
    page.items.forEach((item) => {
      const key = getKey(item)
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    })
  })

  return items
}

/**
 * Grids render at 2 / 3 / 4 / 6 columns across breakpoints. Showing a multiple of
 * 12 (the LCM of those column counts) keeps the last row full at every width, so
 * there are no empty gaps before the "Ver más" button. Only trims while more pages
 * can still load — the remainder shows up on the next load; the final page is shown whole.
 */
export function fillGridRows<TItem>(items: TItem[], hasMore: boolean, rowUnit = 12): TItem[] {
  if (!hasMore || items.length < rowUnit) {
    return items
  }

  const complete = Math.floor(items.length / rowUnit) * rowUnit
  return items.slice(0, complete)
}

export function flattenUniqueArrayPages<TItem>(data: { pages: TItem[][] } | undefined, getKey: (item: TItem) => string) {
  const seen = new Set<string>()
  const items: TItem[] = []

  data?.pages.forEach((page) => {
    page.forEach((item) => {
      const key = getKey(item)
      if (!seen.has(key)) {
        seen.add(key)
        items.push(item)
      }
    })
  })

  return items
}
