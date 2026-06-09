import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { addToLibrary, getMovieDetails } from '../../src/api/services'
import { AppText } from '../../src/components/AppText'
import { LoadingState, MediaRail } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { useAuth } from '../../src/auth/AuthProvider'
import { colors } from '../../src/theme/colors'

export default function MovieDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const tmdbId = Number(id)
  const router = useRouter()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const details = useQuery({ queryKey: ['movie', tmdbId], queryFn: () => getMovieDetails(tmdbId), enabled: Number.isFinite(tmdbId) })
  const add = useMutation({
    mutationFn: () => addToLibrary('Movie', tmdbId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['library'] })
  })

  if (details.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!details.data) {
    return <Screen><AppText>No encontramos esta pelicula.</AppText></Screen>
  }

  const movie = details.data

  return (
    <Screen>
      <ImageBackground source={{ uri: movie.backdropUrl ?? movie.posterUrl ?? undefined }} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.overlay}>
          <AppText weight="bold" style={styles.title}>{movie.title}</AppText>
          <AppText tone="muted">{movie.releaseDate?.slice(0, 4) ?? 'S/F'} · {movie.voteAverage?.toFixed(1) ?? 'S/R'} · {movie.runtimeMinutes ?? '-'} min</AppText>
        </View>
      </ImageBackground>

      <View style={styles.actions}>
        <PrimaryButton onPress={() => auth.isAuthenticated ? add.mutate() : router.push('/auth')} disabled={add.isPending}>
          {auth.isAuthenticated ? add.isPending ? 'Guardando...' : 'Agregar a biblioteca' : 'Iniciar sesion'}
        </PrimaryButton>
      </View>

      <AppText tone="muted" style={styles.overview}>{movie.overview ?? 'Sin sinopsis disponible.'}</AppText>
      <Chips title="Generos" items={movie.genres} />
      <Chips title="Ratings externos" items={movie.externalRatings.map((rating) => `${rating.label} ${formatRating(rating.value, rating.scale)}`)} />
      <Chips title="Donde ver" items={movie.watchProviders.map((provider) => provider.name)} />
      <Chips title="Reparto" items={movie.cast.slice(0, 10).map((person) => `${person.name}${person.role ? ` como ${person.role}` : ''}`)} />
      <MediaRail title="Tambien podria gustarte" items={movie.recommendations} />
    </Screen>
  )
}

function Chips({ title, items }: { title: string; items: string[] }) {
  if (!items.length) {
    return null
  }

  return (
    <View style={styles.block}>
      <AppText weight="bold" style={styles.blockTitle}>{title}</AppText>
      <View style={styles.chips}>{items.map((item) => <AppText key={item} style={styles.chip}>{item}</AppText>)}</View>
    </View>
  )
}

function formatRating(value: number, scale: number) {
  return scale === 100 ? `${Math.round(value)}%` : `${value.toFixed(1)}/${scale}`
}

const styles = StyleSheet.create({
  hero: {
    minHeight: 360,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: colors.panel
  },
  heroImage: {
    borderRadius: 22
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: 8,
    padding: 18,
    backgroundColor: 'rgba(5,8,15,0.70)'
  },
  title: {
    fontSize: 34,
    lineHeight: 38
  },
  actions: {
    gap: 10
  },
  overview: {
    fontSize: 16,
    lineHeight: 24
  },
  block: {
    gap: 10
  },
  blockTitle: {
    fontSize: 19
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    overflow: 'hidden',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  }
})
