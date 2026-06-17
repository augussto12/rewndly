import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import {
  discoverMovies,
  discoverSeries,
  getMovieGenres,
  getMovieRanking,
  getMovieWatchProviders,
  getSeriesGenres,
  getSeriesWatchProviders,
  getTopRatedMovies,
  searchAll
} from '../../src/api/services'
import type { DiscoverFilters, Genre, MediaSummary, WatchProviderOption } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState, MediaRail, PersonCard } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { classicsFilters, exploreMoods, gemsFilters } from '../../src/lib/discoveryCollections'
import { colors } from '../../src/theme/colors'
import { rf } from '../../src/theme/typography'

type MediaType = 'Movie' | 'Series'
type SelectKey = 'sort' | 'genre' | 'period' | 'rating' | 'runtime' | 'provider' | null
type FilterOption = { key: string; label: string; description?: string; filters: DiscoverFilters }

const movieSortOptions: FilterOption[] = [
  { key: 'popularity.desc', label: 'Popularidad', description: 'Lo mas visto y buscado.', filters: { sortBy: 'popularity.desc' } },
  { key: 'vote_average.desc', label: 'Mejor rating', description: 'Titulos bien valorados.', filters: { sortBy: 'vote_average.desc' } },
  { key: 'primary_release_date.desc', label: 'Estrenos', description: 'Lo mas nuevo primero.', filters: { sortBy: 'primary_release_date.desc' } },
  { key: 'revenue.desc', label: 'Taquilla', description: 'Mayores recaudaciones.', filters: { sortBy: 'revenue.desc' } }
]

const seriesSortOptions: FilterOption[] = [
  { key: 'popularity.desc', label: 'Popularidad', description: 'Lo mas visto y buscado.', filters: { sortBy: 'popularity.desc' } },
  { key: 'vote_average.desc', label: 'Mejor rating', description: 'Series bien valoradas.', filters: { sortBy: 'vote_average.desc' } },
  { key: 'first_air_date.desc', label: 'Nuevas', description: 'Emision reciente.', filters: { sortBy: 'first_air_date.desc' } }
]

const periodOptions: FilterOption[] = [
  { key: 'all', label: 'Todas', filters: {} },
  { key: '2020s', label: '2020s', filters: { yearFrom: 2020 } },
  { key: '2010s', label: '2010s', filters: { yearFrom: 2010, yearTo: 2019 } },
  { key: '2000s', label: '2000s', filters: { yearFrom: 2000, yearTo: 2009 } },
  { key: '90s', label: '90s', filters: { yearFrom: 1990, yearTo: 1999 } },
  { key: 'classic', label: 'Clasicas', filters: { yearTo: 1989 } }
]

const ratingOptions: FilterOption[] = [
  { key: 'all', label: 'Cualquiera', filters: {} },
  { key: '6.5', label: '6.5+', filters: { minVoteAverage: 6.5 } },
  { key: '7', label: '7+', filters: { minVoteAverage: 7 } },
  { key: '7.5', label: '7.5+', filters: { minVoteAverage: 7.5 } },
  { key: '8', label: '8+', filters: { minVoteAverage: 8 } }
]

const runtimeOptions: FilterOption[] = [
  { key: 'all', label: 'Cualquiera', filters: {} },
  { key: 'short', label: 'Hasta 95 min', filters: { runtimeMax: 95 } },
  { key: 'medium', label: 'Hasta 120 min', filters: { runtimeMax: 120 } },
  { key: 'long', label: 'Hasta 150 min', filters: { runtimeMax: 150 } }
]

const fallbackMovieGenres: Genre[] = [
  { tmdbId: 28, name: 'Accion' },
  { tmdbId: 12, name: 'Aventura' },
  { tmdbId: 16, name: 'Animacion' },
  { tmdbId: 35, name: 'Comedia' },
  { tmdbId: 80, name: 'Crimen' },
  { tmdbId: 18, name: 'Drama' },
  { tmdbId: 27, name: 'Terror' },
  { tmdbId: 878, name: 'Sci-Fi' },
  { tmdbId: 53, name: 'Thriller' }
]

const fallbackSeriesGenres: Genre[] = [
  { tmdbId: 10759, name: 'Accion' },
  { tmdbId: 16, name: 'Animacion' },
  { tmdbId: 35, name: 'Comedia' },
  { tmdbId: 80, name: 'Crimen' },
  { tmdbId: 18, name: 'Drama' },
  { tmdbId: 9648, name: 'Misterio' },
  { tmdbId: 10765, name: 'Fantasia' }
]

const fallbackProviders: WatchProviderOption[] = [
  { providerId: 8, name: 'Netflix', logoUrl: null },
  { providerId: 119, name: 'Prime Video', logoUrl: null },
  { providerId: 337, name: 'Disney+', logoUrl: null },
  { providerId: 1899, name: 'Max', logoUrl: null },
  { providerId: 2, name: 'Apple TV', logoUrl: null }
]

export default function DiscoverScreen() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [mediaType, setMediaType] = useState<MediaType>('Movie')
  const [sortKey, setSortKey] = useState('popularity.desc')
  const [genreKey, setGenreKey] = useState('all')
  const [periodKey, setPeriodKey] = useState('all')
  const [ratingKey, setRatingKey] = useState('all')
  const [runtimeKey, setRuntimeKey] = useState('all')
  const [providerKey, setProviderKey] = useState('all')
  const [openSelect, setOpenSelect] = useState<SelectKey>(null)
  const [activeMood, setActiveMood] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const liveQuery = query.trim()
  const normalizedQuery = debouncedQuery.trim()
  const sortOptions = mediaType === 'Movie' ? movieSortOptions : seriesSortOptions
  const genres = useQuery({
    queryKey: ['discover-genres', mediaType],
    queryFn: () => mediaType === 'Movie' ? getMovieGenres() : getSeriesGenres(),
    staleTime: 1000 * 60 * 60 * 24
  })
  const providers = useQuery({
    queryKey: ['discover-providers', mediaType],
    queryFn: () => mediaType === 'Movie' ? getMovieWatchProviders() : getSeriesWatchProviders(),
    staleTime: 1000 * 60 * 60 * 12
  })
  const genreOptions = useMemo(() => toGenreOptions(genres.data ?? (mediaType === 'Movie' ? fallbackMovieGenres : fallbackSeriesGenres)), [genres.data, mediaType])
  const providerOptions = useMemo(() => toProviderOptions(providers.data ?? fallbackProviders), [providers.data])
  const selectedSort = findOption(sortOptions, sortKey)
  const selectedGenre = findOption(genreOptions, genreKey)
  const selectedPeriod = findOption(periodOptions, periodKey)
  const selectedRating = findOption(ratingOptions, ratingKey)
  const selectedRuntime = findOption(runtimeOptions, runtimeKey)
  const selectedProvider = findOption(providerOptions, providerKey)
  const filters = useMemo(() => ({
    ...selectedSort.filters,
    ...selectedGenre.filters,
    ...selectedPeriod.filters,
    ...selectedRating.filters,
    ...(mediaType === 'Movie' ? selectedRuntime.filters : {}),
    ...selectedProvider.filters
  }), [mediaType, selectedGenre.filters, selectedPeriod.filters, selectedProvider.filters, selectedRating.filters, selectedRuntime.filters, selectedSort.filters])
  const activeFilterCount = [genreKey, periodKey, ratingKey, providerKey, mediaType === 'Movie' ? runtimeKey : 'all'].filter((value) => value !== 'all').length + (sortKey !== 'popularity.desc' ? 1 : 0)
  const mood = activeMood ? exploreMoods.find((item) => item.value === activeMood) ?? null : null
  const effectiveType = mood ? mood.mediaType : mediaType
  const effectiveFilters = mood ? mood.filters : filters
  const search = useQuery({
    queryKey: ['search', normalizedQuery],
    queryFn: () => searchAll(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 1000 * 60
  })
  const results = useInfiniteQuery({
    queryKey: ['discover-mobile', activeMood, effectiveType, sortKey, genreKey, periodKey, ratingKey, runtimeKey, providerKey],
    queryFn: ({ pageParam }) => effectiveType === 'Movie' ? discoverMovies(effectiveFilters, pageParam) : discoverSeries(effectiveFilters, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.hasMore ? lastPage.page + 1 : undefined,
    staleTime: 1000 * 60 * 3
  })
  const items = useMemo(() => dedupeMedia(results.data?.pages.flatMap((page) => page.items) ?? []), [results.data])
  const surprise = useMemo(() => pickSurprise(items), [items])
  const gems = useQuery({ queryKey: ['discover-gems'], queryFn: () => discoverMovies(gemsFilters, 1), staleTime: 1000 * 60 * 10 })
  const classics = useQuery({ queryKey: ['discover-classics'], queryFn: () => discoverMovies(classicsFilters, 1), staleTime: 1000 * 60 * 10 })
  const critics = useQuery({ queryKey: ['discover-critics'], queryFn: () => getMovieRanking('critics', 1, 12), staleTime: 1000 * 60 * 10 })
  const audience = useQuery({ queryKey: ['discover-audience'], queryFn: () => getTopRatedMovies(1), staleTime: 1000 * 60 * 10 })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 320)
    return () => clearTimeout(timer)
  }, [query])

  function changeType(value: MediaType) {
    setActiveMood(null)
    setMediaType(value)
    setSortKey('popularity.desc')
    setGenreKey('all')
    setRuntimeKey('all')
    setProviderKey('all')
    setOpenSelect(null)
  }

  function clearFilters() {
    setActiveMood(null)
    setSortKey('popularity.desc')
    setGenreKey('all')
    setPeriodKey('all')
    setRatingKey('all')
    setRuntimeKey('all')
    setProviderKey('all')
    setOpenSelect(null)
  }

  function changeFilter(value: string, setter: (value: string) => void) {
    setActiveMood(null)
    setAndClose(value, setter, setOpenSelect)
  }

  function toggleMood(value: string) {
    const mood = exploreMoods.find((item) => item.value === value)
    setActiveMood((current) => (current === value ? null : value))
    if (mood) {
      setMediaType(mood.mediaType)
    }
    setOpenSelect(null)
  }

  function surpriseMe() {
    if (!surprise) {
      return
    }

    router.push(surprise.mediaType === 'Movie' ? `/movie/${surprise.tmdbId}` : `/series/${surprise.tmdbId}`)
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="accent" weight="bold">EXPLORAR</AppText>
        <AppText weight="bold" style={styles.title}>Buscar y descubrir</AppText>
      </View>

      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar pelicula, serie o persona"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.input}
        />
      </View>

      {liveQuery.length >= 2 ? (
        <View style={styles.searchResults}>
          {search.isLoading ? <LoadingState /> : null}
          {search.data ? (
            <>
              <MediaRail title="Peliculas" items={search.data.movies} />
              <MediaRail title="Series" items={search.data.series} />
              <View style={styles.peopleSection}>
                <AppText weight="bold" style={styles.sectionTitle}>Personas</AppText>
                {search.data.people.length ? search.data.people.slice(0, 4).map((person) => <PersonCard key={person.tmdbId} item={person} />) : <AppText tone="muted">Sin personas.</AppText>}
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      <View style={styles.moodRow}>
        {exploreMoods.map((item) => (
          <Pressable key={item.value} onPress={() => toggleMood(item.value)} style={[styles.moodChip, activeMood === item.value ? styles.moodChipActive : null]}>
            <AppText weight="bold" tone={activeMood === item.value ? 'default' : 'muted'} style={styles.moodText}>{item.label}</AppText>
          </Pressable>
        ))}
      </View>

      <View style={styles.toolbar}>
        <Pressable onPress={() => setShowFilters((value) => !value)} style={[styles.filterToggle, showFilters ? styles.filterToggleActive : null]}>
          <AppText weight="bold">{showFilters ? 'Ocultar filtros' : 'Filtros'}{activeFilterCount && !showFilters ? ` (${activeFilterCount})` : ''}</AppText>
        </Pressable>
        <PrimaryButton onPress={surpriseMe} disabled={!surprise}>Sorpresa</PrimaryButton>
      </View>

      {showFilters ? (
        <View style={styles.filterPanel}>
          <View style={styles.segment}>
            <SegmentButton label="Peliculas" active={effectiveType === 'Movie'} onPress={() => changeType('Movie')} />
            <SegmentButton label="Series" active={effectiveType === 'Series'} onPress={() => changeType('Series')} />
          </View>

          <View style={styles.selectGrid}>
            <SelectControl label="Orden" value={selectedSort.label} options={sortOptions} expanded={openSelect === 'sort'} onToggle={() => toggleSelect('sort', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setSortKey)} />
            <SelectControl label="Genero" value={selectedGenre.label} options={genreOptions} expanded={openSelect === 'genre'} onToggle={() => toggleSelect('genre', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setGenreKey)} />
            <SelectControl label="Epoca" value={selectedPeriod.label} options={periodOptions} expanded={openSelect === 'period'} onToggle={() => toggleSelect('period', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setPeriodKey)} />
            <SelectControl label="Rating" value={selectedRating.label} options={ratingOptions} expanded={openSelect === 'rating'} onToggle={() => toggleSelect('rating', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setRatingKey)} />
            {mediaType === 'Movie' ? <SelectControl label="Duracion" value={selectedRuntime.label} options={runtimeOptions} expanded={openSelect === 'runtime'} onToggle={() => toggleSelect('runtime', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setRuntimeKey)} /> : null}
            <SelectControl label="Plataforma" value={selectedProvider.label} options={providerOptions} expanded={openSelect === 'provider'} onToggle={() => toggleSelect('provider', openSelect, setOpenSelect)} onChange={(value) => changeFilter(value, setProviderKey)} />
          </View>

          <View style={styles.panelFooter}>
            <AppText tone="muted" numberOfLines={2} style={{ flex: 1 }}>{mood ? mood.description : activeFilterCount ? `${activeFilterCount} filtros activos` : 'Catalogo general'}</AppText>
            <PrimaryButton variant="secondary" onPress={clearFilters}>Limpiar</PrimaryButton>
          </View>
        </View>
      ) : null}

      <View style={styles.resultsBlock}>
        {results.isLoading ? <LoadingState /> : null}
        {results.isError ? <EmptyState title="No pudimos explorar" message="Proba otro filtro o revisa la conexion." /> : null}
        {!results.isLoading && !results.isError && !items.length ? <EmptyState title="Sin resultados" message="Cambia algun filtro para ver otras opciones." /> : null}
        <MediaRail title={mood ? mood.label : effectiveType === 'Movie' ? 'Peliculas encontradas' : 'Series encontradas'} items={items} limit={items.length} />
        {results.hasNextPage && items.length ? (
          <PrimaryButton variant="secondary" onPress={() => results.fetchNextPage()} disabled={results.isFetchingNextPage}>
            {results.isFetchingNextPage ? 'Cargando...' : 'Mostrar mas'}
          </PrimaryButton>
        ) : null}
      </View>

      <MediaRail title="Joyas para descubrir" items={gems.data?.items ?? []} />
      <MediaRail title="Aclamadas por la critica" items={(critics.data?.items ?? []).map((item) => item.media)} />
      <MediaRail title="El publico las ama" items={audience.data?.items ?? []} />
      <MediaRail title="Clasicos imprescindibles" items={classics.data?.items ?? []} />
    </Screen>
  )
}

function SelectControl({
  label,
  value,
  options,
  expanded,
  onToggle,
  onChange
}: {
  label: string
  value: string
  options: FilterOption[]
  expanded: boolean
  onToggle: () => void
  onChange: (value: string) => void
}) {
  return (
    <View style={styles.selectBlock}>
      <Pressable onPress={onToggle} style={({ pressed }) => [styles.selectButton, pressed ? styles.pressed : null]}>
        <View style={{ flex: 1 }}>
          <AppText tone="muted" style={styles.selectLabel}>{label}</AppText>
          <AppText weight="bold" numberOfLines={1}>{value}</AppText>
        </View>
        <AppText tone="accent" weight="bold">{expanded ? 'Cerrar' : 'Cambiar'}</AppText>
      </Pressable>
      {expanded ? (
        <View style={styles.selectMenu}>
          {options.map((option) => (
            <Pressable key={option.key} onPress={() => onChange(option.key)} style={styles.optionRow}>
              <AppText weight={option.label === value ? 'bold' : 'regular'} numberOfLines={1}>{option.label}</AppText>
              {option.description ? <AppText tone="muted" numberOfLines={1} style={styles.optionDescription}>{option.description}</AppText> : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  )
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}>
      <AppText weight="bold" tone={active ? 'default' : 'muted'}>{label}</AppText>
    </Pressable>
  )
}

function toGenreOptions(items: Genre[]): FilterOption[] {
  return [
    { key: 'all', label: 'Todos', filters: {} },
    ...items.map((item) => ({ key: String(item.tmdbId), label: item.name, filters: { genreId: item.tmdbId } }))
  ]
}

function toProviderOptions(items: WatchProviderOption[]): FilterOption[] {
  return [
    { key: 'all', label: 'Todas', filters: {} },
    ...items.slice(0, 18).map((item) => ({ key: String(item.providerId), label: item.name, filters: { watchProviderId: item.providerId } }))
  ]
}

function findOption(options: FilterOption[], key: string) {
  return options.find((item) => item.key === key) ?? options[0]
}

function toggleSelect(key: SelectKey, openSelect: SelectKey, setOpenSelect: (value: SelectKey) => void) {
  setOpenSelect(openSelect === key ? null : key)
}

function setAndClose(value: string, setter: (value: string) => void, setOpenSelect: (value: SelectKey) => void) {
  setter(value)
  setOpenSelect(null)
}

function dedupeMedia(items: MediaSummary[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    const key = `${item.mediaType}-${item.tmdbId}`
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}

function pickSurprise(items: MediaSummary[]) {
  if (!items.length) {
    return null
  }

  return items[Math.floor(Math.random() * items.length)]
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
  searchResults: {
    gap: 16
  },
  peopleSection: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 18
  },
  moodRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  moodChip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  moodChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  moodText: {
    fontSize: 13
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  filterToggle: {
    flex: 1,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  filterToggleActive: {
    borderColor: colors.accent
  },
  resultsBlock: {
    gap: 12
  },
  filterPanel: {
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7
  },
  segmentButtonActive: {
    backgroundColor: colors.accent
  },
  selectGrid: {
    gap: 8
  },
  selectBlock: {
    overflow: 'hidden',
    borderRadius: 8,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1
  },
  selectButton: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12
  },
  selectLabel: {
    fontSize: 12
  },
  selectMenu: {
    borderTopColor: colors.border,
    borderTopWidth: 1
  },
  optionRow: {
    minHeight: 46,
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: 12,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  optionDescription: {
    fontSize: 12
  },
  panelFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 2
  },
  pressed: {
    opacity: 0.78
  }
})
