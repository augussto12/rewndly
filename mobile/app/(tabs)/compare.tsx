import { useQueries, useQuery } from '@tanstack/react-query'
import { Link } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Image, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { getMovieDetails, getSeriesDetails, searchAll } from '../../src/api/services'
import type { MediaSummary, MovieDetails, SeriesDetails } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { formatExternalRating, pickCriticRating, ratingBySource } from '../../src/lib/externalRatings'
import { translateSeriesStatus } from '../../src/lib/seriesStatus'
import { colors } from '../../src/theme/colors'
import { rf } from '../../src/theme/typography'

type CompareSelection = { mediaType: 'Movie' | 'Series'; tmdbId: number }
type CompareDetails = MovieDetails | SeriesDetails

const maxSelections = 3

export default function CompareScreen() {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [selections, setSelections] = useState<CompareSelection[]>([])
  const normalizedQuery = debouncedQuery.trim()
  const canSearch = normalizedQuery.length >= 2

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 280)
    return () => clearTimeout(timer)
  }, [query])

  const search = useQuery({
    queryKey: ['compare-search', normalizedQuery],
    queryFn: () => searchAll(normalizedQuery),
    enabled: canSearch,
    staleTime: 1000 * 60
  })
  const searchResults = useMemo(
    () => mergeResults(search.data?.movies ?? [], search.data?.series ?? []),
    [search.data?.movies, search.data?.series]
  )

  const detailQueries = useQueries({
    queries: selections.map((selection) => ({
      queryKey: ['compare-details', selection.mediaType, selection.tmdbId],
      queryFn: () => (selection.mediaType === 'Movie' ? getMovieDetails(selection.tmdbId) : getSeriesDetails(selection.tmdbId)),
      staleTime: 1000 * 60 * 30
    }))
  })
  const compareItems = detailQueries.map((detail, index) => ({
    selection: selections[index],
    detail: detail.data as CompareDetails | undefined,
    isLoading: detail.isLoading
  }))

  function toggleSelection(item: MediaSummary) {
    setSelections((current) => {
      const exists = current.some((selection) => selection.mediaType === item.mediaType && selection.tmdbId === item.tmdbId)
      if (exists) {
        return current.filter((selection) => !(selection.mediaType === item.mediaType && selection.tmdbId === item.tmdbId))
      }
      if (current.length >= maxSelections) {
        return current
      }
      return [...current, { mediaType: item.mediaType, tmdbId: item.tmdbId }]
    })
  }

  function removeSelection(selection: CompareSelection) {
    setSelections((current) => current.filter((item) => !(item.mediaType === selection.mediaType && item.tmdbId === selection.tmdbId)))
  }

  const isFull = selections.length >= maxSelections

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="accent" weight="bold">COMPARAR</AppText>
        <AppText weight="bold" style={styles.title}>Que conviene ver?</AppText>
        <AppText tone="muted">Elegi 2 o 3 titulos y compara ratings, plataformas, duracion, generos y reparto.</AppText>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar pelicula o serie"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.input}
        />
      </View>

      {canSearch ? (
        <View style={styles.results}>
          {search.isLoading ? <LoadingState /> : null}
          {!search.isLoading && searchResults.length === 0 ? <AppText tone="muted">Sin resultados.</AppText> : null}
          {searchResults.map((item) => {
            const selected = selections.some((selection) => selection.mediaType === item.mediaType && selection.tmdbId === item.tmdbId)
            return (
              <Pressable
                key={`${item.mediaType}-${item.tmdbId}`}
                onPress={() => toggleSelection(item)}
                disabled={isFull && !selected}
                style={({ pressed }) => [styles.resultRow, isFull && !selected ? styles.disabledRow : null, pressed ? styles.pressed : null]}
              >
                <View style={styles.resultPoster}>
                  {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.fill} resizeMode="cover" fadeDuration={0} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText weight="semibold" numberOfLines={1}>{item.title}</AppText>
                  <AppText tone="muted" numberOfLines={1}>
                    {item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}{item.releaseDate ? ` · ${item.releaseDate.slice(0, 4)}` : ''}
                  </AppText>
                </View>
                <AppText tone="accent" weight="bold">{selected ? 'Quitar' : 'Agregar'}</AppText>
              </Pressable>
            )
          })}
        </View>
      ) : null}

      <View style={styles.selectionBar}>
        <AppText weight="bold">Seleccion {selections.length}/{maxSelections}</AppText>
        {selections.length ? <Pressable onPress={() => setSelections([])}><AppText tone="accent" weight="bold">Limpiar</AppText></Pressable> : null}
      </View>

      {selections.length < 2 ? (
        <EmptyState title="Suma al menos 2 titulos" message="Busca y elegi peliculas o series para ver la comparativa." />
      ) : (
        <>
          <View style={styles.cards}>
            {compareItems.map((item) => (
              <CompareCard key={`${item.selection.mediaType}-${item.selection.tmdbId}`} item={item} onRemove={() => removeSelection(item.selection)} />
            ))}
          </View>

          <View style={styles.table}>
            <CompareRow label="IMDb" items={compareItems} render={(detail) => formatRatingCell(ratingBySource(detail.externalRatings, 'IMDb'))} />
            <CompareRow label="Critica" items={compareItems} render={(detail) => formatRatingCell(pickCriticRating(detail.externalRatings))} />
            <CompareRow label="Duracion" items={compareItems} render={(detail) => formatDuration(detail)} />
            <CompareRow label="Plataformas" items={compareItems} render={(detail) => formatProviders(detail)} />
            <CompareRow label="Generos" items={compareItems} render={(detail) => detail.genres.slice(0, 3).join(', ') || 'Sin dato'} />
            <CompareRow label="Ano" items={compareItems} render={(detail) => getYear(detail) ?? 'Sin dato'} />
            <CompareRow label="Reparto" items={compareItems} render={(detail) => detail.cast.slice(0, 3).map((person) => person.name).join(', ') || 'Sin dato'} last />
          </View>
        </>
      )}
    </Screen>
  )
}

function CompareCard({
  item,
  onRemove
}: {
  item: { selection: CompareSelection; detail: CompareDetails | undefined; isLoading: boolean }
  onRemove: () => void
}) {
  const { detail, selection } = item
  const href = selection.mediaType === 'Movie' ? `/movie/${selection.tmdbId}` : `/series/${selection.tmdbId}`

  if (item.isLoading || !detail) {
    return (
      <View style={[styles.card, styles.cardLoading]}>
        <AppText tone="muted">{item.isLoading ? 'Cargando...' : 'Sin datos'}</AppText>
      </View>
    )
  }

  return (
    <View style={styles.card}>
      <Link href={href} asChild>
        <Pressable style={styles.cardPoster}>
          {detail.posterUrl ? <Image source={{ uri: detail.posterUrl }} style={styles.fill} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin poster</AppText>}
        </Pressable>
      </Link>
      <AppText weight="bold" numberOfLines={2} style={styles.cardTitle}>{getTitle(detail)}</AppText>
      <Pressable onPress={onRemove}><AppText tone="muted">Quitar</AppText></Pressable>
    </View>
  )
}

function CompareRow({
  label,
  items,
  render,
  last
}: {
  label: string
  items: Array<{ detail: CompareDetails | undefined; isLoading: boolean }>
  render: (detail: CompareDetails) => string
  last?: boolean
}) {
  return (
    <View style={[styles.row, last ? styles.rowLast : null]}>
      <AppText tone="muted" weight="semibold" style={styles.rowLabel}>{label}</AppText>
      <View style={styles.rowCells}>
        {items.map((item, index) => (
          <View key={index} style={styles.cell}>
            <AppText style={styles.cellText}>{item.isLoading ? '...' : item.detail ? render(item.detail) : 'Sin dato'}</AppText>
          </View>
        ))}
      </View>
    </View>
  )
}

function mergeResults(movies: MediaSummary[], series: MediaSummary[]) {
  const seen = new Set<string>()
  return [...movies.slice(0, 6), ...series.slice(0, 6)].filter((item) => {
    const key = `${item.mediaType}-${item.tmdbId}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  }).slice(0, 10)
}

function getTitle(detail: CompareDetails) {
  return detail.mediaType === 'Movie' ? detail.title : detail.name
}

function getYear(detail: CompareDetails) {
  const date = detail.mediaType === 'Movie' ? detail.releaseDate : detail.firstAirDate
  return date?.slice(0, 4) ?? null
}

function formatRatingCell(rating: Parameters<typeof formatExternalRating>[0]) {
  const value = formatExternalRating(rating)
  return value ? `${rating?.label ?? ''} ${value}`.trim() : 'Sin dato'
}

function formatDuration(detail: CompareDetails) {
  if (detail.mediaType === 'Movie') {
    if (!detail.runtimeMinutes) {
      return 'Sin dato'
    }
    const hours = Math.floor(detail.runtimeMinutes / 60)
    const rest = detail.runtimeMinutes % 60
    return hours === 0 ? `${rest} min` : rest > 0 ? `${hours}h ${rest}m` : `${hours}h`
  }

  const parts = [
    detail.numberOfSeasons ? `${detail.numberOfSeasons} temp.` : null,
    detail.numberOfEpisodes ? `${detail.numberOfEpisodes} eps.` : null
  ].filter(Boolean)
  return parts.join(' / ') || translateSeriesStatus(detail.status) || 'Sin dato'
}

function formatProviders(detail: CompareDetails) {
  const streaming = detail.watchProviders.filter((provider) => provider.type === 'Streaming')
  const pool = streaming.length ? streaming : detail.watchProviders
  const seen = new Set<number>()
  const names = pool.filter((provider) => {
    if (seen.has(provider.providerId)) {
      return false
    }
    seen.add(provider.providerId)
    return true
  }).slice(0, 3).map((provider) => provider.name)
  return names.join(', ') || 'Sin dato'
}

const styles = StyleSheet.create({
  header: {
    gap: 6
  },
  title: {
    fontSize: rf(32),
    lineHeight: rf(36)
  },
  searchBox: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16
  },
  results: {
    gap: 8
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  disabledRow: {
    opacity: 0.45
  },
  resultPoster: {
    width: 38,
    height: 57,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  cards: {
    flexDirection: 'row',
    gap: 10
  },
  card: {
    flex: 1,
    gap: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  cardLoading: {
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardPoster: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1
  },
  cardTitle: {
    fontSize: 14,
    lineHeight: 18
  },
  table: {
    overflow: 'hidden',
    borderRadius: 10,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    backgroundColor: colors.surface
  },
  row: {
    gap: 6,
    padding: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  rowLast: {
    borderBottomWidth: 0
  },
  rowLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6
  },
  rowCells: {
    flexDirection: 'row',
    gap: 8
  },
  cell: {
    flex: 1
  },
  cellText: {
    fontSize: 13,
    lineHeight: 17
  },
  fill: {
    width: '100%',
    height: '100%'
  },
  pressed: {
    opacity: 0.75
  }
})
