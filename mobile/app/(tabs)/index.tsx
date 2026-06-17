import { useQuery } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { Pressable, StyleSheet, View } from 'react-native'
import { discoverMovies, getHome, getMovieRanking } from '../../src/api/services'
import type { RankedMediaSummary } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { FeaturedCarousel } from '../../src/components/FeaturedCarousel'
import { EmptyState, LoadingState, MediaRail } from '../../src/components/MediaComponents'
import { Screen } from '../../src/components/Screen'
import { gemsFilters } from '../../src/lib/discoveryCollections'
import { colors, gradients } from '../../src/theme/colors'
import { rf } from '../../src/theme/typography'

export default function HomeScreen() {
  const home = useQuery({ queryKey: ['home'], queryFn: getHome, staleTime: 1000 * 60 * 5 })
  const rankingEnabled = Boolean(home.data)
  const imdb = useQuery({
    queryKey: ['movie-ranking', 'imdb'],
    queryFn: () => getMovieRanking('imdb', 1, 10),
    enabled: rankingEnabled,
    staleTime: 1000 * 60 * 10
  })
  const critics = useQuery({
    queryKey: ['movie-ranking', 'critics'],
    queryFn: () => getMovieRanking('critics', 1, 10),
    enabled: rankingEnabled,
    staleTime: 1000 * 60 * 10
  })
  const gems = useQuery({
    queryKey: ['home-gems'],
    queryFn: () => discoverMovies(gemsFilters, 1),
    enabled: rankingEnabled,
    staleTime: 1000 * 60 * 10
  })
  const featuredItems = [
    ...(home.data?.trendingMovies ?? []),
    ...(home.data?.nowPlayingMovies ?? []),
    ...(home.data?.popularMovies ?? []),
    ...(home.data?.trendingSeries ?? [])
  ]
  const imdbItems = (imdb.data?.items ?? []).map((item) => item.media)
  const criticItems = (critics.data?.items ?? []).map((item) => item.media)

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="accent" weight="bold">REWNDLY</AppText>
        <AppText weight="bold" style={styles.title}>Tu cine, tus rankings.</AppText>
        <AppText tone="muted">Destacadas, ratings y recomendaciones para elegir rapido.</AppText>
      </View>

      {home.isLoading ? <LoadingState /> : null}
      {home.isError ? <EmptyState title="Catalogo en espera" message="No pudimos cargar la portada publica." /> : null}

      <FeaturedCarousel items={featuredItems} />

      <View style={styles.actions}>
        <ActionCard href="/discover" title="Explorar" message="Filtros y recomendaciones." />
        <ActionCard href="/game" title="Juegos" message="Adivina posters." />
      </View>

      <MediaRail title="Peliculas destacadas" items={home.data?.trendingMovies ?? []} />
      <MediaRail title="Mejor rating IMDb" items={imdbItems} rankLabels={toRankLabels(imdb.data?.items ?? [])} />
      <MediaRail title="Mejor valoradas por la critica" items={criticItems} rankLabels={toRankLabels(critics.data?.items ?? [])} />
      <MediaRail title="Joyas para descubrir" items={gems.data?.items ?? []} />
      <MediaRail title="Favoritas de la audiencia" items={home.data?.popularMovies ?? []} />
      <MediaRail title="Series en tendencia" items={home.data?.trendingSeries ?? []} />
    </Screen>
  )
}

function ActionCard({ href, title, message }: { href: '/discover' | '/game'; title: string; message: string }) {
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.actionCard, pressed ? { opacity: 0.78 } : null]}>
        <LinearGradient colors={gradients.surfaceMuted} style={styles.actionFill}>
          <AppText weight="bold" style={styles.actionTitle}>{title}</AppText>
          <AppText tone="muted" numberOfLines={2}>{message}</AppText>
        </LinearGradient>
      </Pressable>
    </Link>
  )
}

function toRankLabels(items: RankedMediaSummary[]) {
  return new Map(items.map((item) => [`${item.media.mediaType}-${item.media.tmdbId}`, formatRank(item)]))
}

function formatRank(item: RankedMediaSummary) {
  if (item.score !== null && item.scoreScale) {
    return `#${item.rank} ${item.scoreScale === 100 ? Math.round(item.score) : item.score.toFixed(1)}`
  }

  return `#${item.rank}`
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    fontSize: rf(32),
    lineHeight: rf(36)
  },
  actions: {
    flexDirection: 'row',
    gap: 12
  },
  actionCard: {
    flex: 1,
    minHeight: 86,
    borderRadius: 8,
    overflow: 'hidden',
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  actionFill: {
    flex: 1,
    gap: 6,
    padding: 14
  },
  actionTitle: {
    fontSize: 18
  }
})
