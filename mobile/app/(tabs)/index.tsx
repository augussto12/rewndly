import { useQuery } from '@tanstack/react-query'
import { ImageBackground, Pressable, StyleSheet, View } from 'react-native'
import { Link } from 'expo-router'
import { getHome } from '../../src/api/services'
import { AppText } from '../../src/components/AppText'
import { LoadingState, MediaRail } from '../../src/components/MediaComponents'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function HomeScreen() {
  const home = useQuery({ queryKey: ['home'], queryFn: getHome })
  const featured = home.data?.trendingMovies?.[0] ?? home.data?.popularSeries?.[0]

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="accent" weight="bold">REWNDLY</AppText>
        <AppText weight="bold" style={styles.title}>Tu cine, tus listas, tu juego.</AppText>
        <AppText tone="muted">Busca peliculas, series y personas; guarda lo que queres ver y juga con posters.</AppText>
      </View>

      {home.isLoading ? <LoadingState /> : null}

      {featured ? (
        <Link href={featured.mediaType === 'Movie' ? `/movie/${featured.tmdbId}` : `/series/${featured.tmdbId}`} asChild>
          <Pressable style={({ pressed }) => [styles.hero, pressed ? { opacity: 0.86 } : null]}>
            <ImageBackground source={{ uri: featured.backdropUrl ?? featured.posterUrl ?? undefined }} style={styles.heroImage} imageStyle={styles.heroImageRadius}>
              <View style={styles.heroOverlay}>
                <AppText tone="accent" weight="bold">Destacada</AppText>
                <AppText weight="bold" style={styles.heroTitle} numberOfLines={2}>{featured.title}</AppText>
                <AppText tone="muted" numberOfLines={3}>{featured.overview ?? 'Sinopsis no disponible.'}</AppText>
              </View>
            </ImageBackground>
          </Pressable>
        </Link>
      ) : null}

      {home.data ? (
        <>
          <MediaRail title="Tendencia en peliculas" items={home.data.trendingMovies} />
          <MediaRail title="Series populares" items={home.data.popularSeries} />
          <MediaRail title="Ahora en cartelera" items={home.data.nowPlayingMovies} />
        </>
      ) : null}
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    fontSize: 34,
    lineHeight: 38
  },
  hero: {
    minHeight: 310,
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: 1,
    backgroundColor: colors.panel
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  heroImageRadius: {
    borderRadius: 20
  },
  heroOverlay: {
    gap: 8,
    padding: 18,
    minHeight: 170,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(5,8,15,0.72)'
  },
  heroTitle: {
    fontSize: 30
  }
})
