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
