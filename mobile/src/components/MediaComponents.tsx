import { Link } from 'expo-router'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import type { MediaSummary, PersonSummary } from '../api/types'
import { colors } from '../theme/colors'
import { AppText } from './AppText'

type MediaCardProps = {
  item: MediaSummary
}

export function MediaCard({ item }: MediaCardProps) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}>
        <View style={styles.poster}>
          {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.posterImage} /> : <AppText tone="faint">Sin poster</AppText>}
        </View>
        <AppText numberOfLines={2} weight="semibold" style={styles.cardTitle}>{item.title}</AppText>
        <AppText tone="muted" style={styles.meta}>
          {item.voteAverage ? item.voteAverage.toFixed(1) : 'S/R'} · {item.mediaType === 'Movie' ? 'Peli' : 'Serie'}
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
          {item.profileUrl ? <Image source={{ uri: item.profileUrl }} style={styles.avatarImage} /> : <AppText tone="faint">?</AppText>}
        </View>
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1}>{item.name}</AppText>
          <AppText tone="muted" numberOfLines={1}>{item.knownForDepartment ?? 'Persona'}</AppText>
        </View>
      </Pressable>
    </Link>
  )
}

export function MediaRail({ title, items }: { title: string; items: MediaSummary[] }) {
  if (!items.length) {
    return null
  }

  return (
    <View style={styles.rail}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.railContent}>
        {items.map((item) => <MediaCard key={`${item.mediaType}-${item.tmdbId}`} item={item} />)}
      </ScrollView>
    </View>
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

const styles = StyleSheet.create({
  rail: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 20
  },
  railContent: {
    gap: 12,
    paddingRight: 18
  },
  card: {
    width: 132,
    gap: 8
  },
  poster: {
    width: 132,
    height: 198,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  posterImage: {
    width: '100%',
    height: '100%'
  },
  cardTitle: {
    minHeight: 38
  },
  meta: {
    fontSize: 12
  },
  personCard: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft
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
    borderRadius: 16,
    backgroundColor: colors.panel
  }
})
