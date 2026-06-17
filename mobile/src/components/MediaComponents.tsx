import { Link } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { ActivityIndicator, Dimensions, FlatList, Image, Pressable, StyleSheet, View } from 'react-native'
import type { MediaPerson, MediaSummary, PersonSummary } from '../api/types'
import { colors } from '../theme/colors'
import { AppText } from './AppText'

const CARD_WIDTH = 122
const CARD_STRIDE = CARD_WIDTH + 12
const POSTER_HEIGHT = 183

const GRID_GAP = 10
const GRID_COLUMNS = 3
const GRID_CARD_WIDTH = Math.floor((Dimensions.get('window').width - 18 * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS)

type MediaCardProps = {
  item: MediaSummary
  rankLabel?: string
}

export function MediaCard({ item, rankLabel }: MediaCardProps) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
        <View style={styles.poster}>
          {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.posterImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin poster</AppText>}
          <LinearGradient pointerEvents="none" colors={['rgba(5,8,15,0)', 'rgba(5,8,15,0.46)']} style={styles.posterShade} />
          {rankLabel ? (
            <View style={styles.rankBadge}>
              <AppText weight="bold" style={styles.rankText}>{rankLabel}</AppText>
            </View>
          ) : null}
        </View>
        <AppText numberOfLines={2} ellipsizeMode="tail" weight="semibold" style={styles.cardTitle}>{item.title}</AppText>
        <AppText tone="muted" style={styles.meta}>
          {item.voteAverage ? item.voteAverage.toFixed(1) : 'S/R'} / {item.mediaType === 'Movie' ? 'Peli' : 'Serie'}
        </AppText>
      </Pressable>
    </Link>
  )
}

export function PersonCard({ item }: { item: PersonSummary }) {
  return (
    <Link href={`/person/${item.tmdbId}`} asChild>
      <Pressable style={({ pressed }) => [styles.personCard, pressed ? styles.pressed : null]}>
        <View style={styles.avatar}>
          {item.profileUrl ? <Image source={{ uri: item.profileUrl }} style={styles.avatarImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">?</AppText>}
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1}>{item.name}</AppText>
          <AppText tone="muted" numberOfLines={1}>{item.knownForDepartment ?? 'Persona'}</AppText>
        </View>
      </Pressable>
    </Link>
  )
}

export function MediaRail({ title, items, rankLabels }: { title: string; items: MediaSummary[]; rankLabels?: Map<string, string> }) {
  if (!items.length) {
    return null
  }

  const visibleItems = items.slice(0, 10)

  return (
    <View style={styles.rail}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      <FlatList
        data={visibleItems}
        horizontal
        keyExtractor={mediaKey}
        renderItem={({ item }) => <MediaCard item={item} rankLabel={rankLabels?.get(mediaKey(item))} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        initialNumToRender={3}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
        getItemLayout={(_, index) => ({ length: CARD_STRIDE, offset: CARD_STRIDE * index, index })}
      />
    </View>
  )
}

export function MediaGrid({ items }: { items: MediaSummary[] }) {
  if (!items.length) {
    return null
  }

  return (
    <View style={styles.grid}>
      {items.map((item) => <GridCard key={mediaKey(item)} item={item} />)}
    </View>
  )
}

function GridCard({ item }: { item: MediaSummary }) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.gridCard, pressed ? styles.pressed : null]}>
        <View style={styles.gridPoster}>
          {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.posterImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin poster</AppText>}
          <LinearGradient pointerEvents="none" colors={['rgba(5,8,15,0)', 'rgba(5,8,15,0.46)']} style={styles.posterShade} />
        </View>
        <AppText numberOfLines={2} ellipsizeMode="tail" weight="semibold" style={styles.gridTitle}>{item.title}</AppText>
        <AppText tone="muted" style={styles.meta}>
          {item.voteAverage ? item.voteAverage.toFixed(1) : 'S/R'} · {item.mediaType === 'Movie' ? 'Peli' : 'Serie'}
        </AppText>
      </Pressable>
    </Link>
  )
}

export function CastRail({ title, cast }: { title: string; cast: MediaPerson[] }) {
  if (!cast.length) {
    return null
  }

  const visibleCast = cast.slice(0, 16)

  return (
    <View style={styles.rail}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      <FlatList
        data={visibleCast}
        horizontal
        keyExtractor={(item, index) => `${item.tmdbId}-${index}`}
        renderItem={({ item }) => <CastCard item={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={3}
        removeClippedSubviews
      />
    </View>
  )
}

function CastCard({ item }: { item: MediaPerson }) {
  return (
    <Link href={`/person/${item.tmdbId}`} asChild>
      <Pressable style={({ pressed }) => [styles.castCard, pressed ? styles.pressed : null]}>
        <View style={styles.castPhoto}>
          {item.profileUrl ? <Image source={{ uri: item.profileUrl }} style={styles.posterImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin foto</AppText>}
        </View>
        <AppText numberOfLines={2} ellipsizeMode="tail" weight="semibold" style={styles.castName}>{item.name}</AppText>
        {item.role ? <AppText tone="muted" numberOfLines={2} style={styles.castRole}>{item.role}</AppText> : null}
      </Pressable>
    </Link>
  )
}

export function LoadingState() {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.accent2} />
      <AppText tone="muted">Cargando...</AppText>
    </View>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <View style={styles.empty}>
      <AppText weight="bold">{title}</AppText>
      <AppText tone="muted" style={{ textAlign: 'center' }}>{message}</AppText>
    </View>
  )
}

function mediaKey(item: MediaSummary) {
  return `${item.mediaType}-${item.tmdbId}`
}

const styles = StyleSheet.create({
  rail: {
    gap: 12,
    marginHorizontal: -2
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 24
  },
  railContent: {
    gap: 12,
    paddingHorizontal: 2,
    paddingRight: 18
  },
  card: {
    width: CARD_WIDTH,
    overflow: 'hidden',
    gap: 8,
    paddingBottom: 2
  },
  poster: {
    width: CARD_WIDTH,
    height: POSTER_HEIGHT,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 0.34,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 3
  },
  posterImage: {
    width: '100%',
    height: '100%'
  },
  posterShade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70
  },
  rankBadge: {
    position: 'absolute',
    left: 8,
    top: 8,
    maxWidth: CARD_WIDTH - 16,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(5,8,15,0.78)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1
  },
  rankText: {
    fontSize: 11
  },
  cardTitle: {
    width: CARD_WIDTH,
    minHeight: 38,
    overflow: 'hidden',
    fontSize: 13,
    lineHeight: 18
  },
  meta: {
    fontSize: 11,
    lineHeight: 15
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP
  },
  gridCard: {
    width: GRID_CARD_WIDTH,
    gap: 6
  },
  gridPoster: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1
  },
  gridTitle: {
    fontSize: 12,
    lineHeight: 16
  },
  castCard: {
    width: 104,
    gap: 6
  },
  castPhoto: {
    width: 104,
    height: 132,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1
  },
  castName: {
    fontSize: 13,
    lineHeight: 17
  },
  castRole: {
    fontSize: 11,
    lineHeight: 15
  },
  personCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  avatarImage: {
    width: '100%',
    height: '100%'
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }]
  },
  state: {
    minHeight: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12
  },
  empty: {
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  }
})
