import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ImageBackground, StyleSheet, View } from 'react-native'
import { addToLibrary, getSeriesDetails } from '../../src/api/services'
import { useAuth } from '../../src/auth/AuthProvider'
import { AppText } from '../../src/components/AppText'
import { LoadingState, MediaRail } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function SeriesDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const tmdbId = Number(id)
  const router = useRouter()
  const auth = useAuth()
  const queryClient = useQueryClient()
  const details = useQuery({ queryKey: ['series', tmdbId], queryFn: () => getSeriesDetails(tmdbId), enabled: Number.isFinite(tmdbId) })
  const add = useMutation({
    mutationFn: () => addToLibrary('Series', tmdbId),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['library'] })
  })

  if (details.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!details.data) {
    return <Screen><AppText>No encontramos esta serie.</AppText></Screen>
  }

  const series = details.data

  return (
    <Screen>
      <ImageBackground source={{ uri: series.backdropUrl ?? series.posterUrl ?? undefined }} style={styles.hero} imageStyle={styles.heroImage}>
        <View style={styles.overlay}>
          <AppText weight="bold" style={styles.title}>{series.name}</AppText>
          <AppText tone="muted">{series.firstAirDate?.slice(0, 4) ?? 'S/F'} · {series.voteAverage?.toFixed(1) ?? 'S/R'} · {series.numberOfSeasons ?? '-'} temp.</AppText>
        </View>
      </ImageBackground>

      <PrimaryButton onPress={() => auth.isAuthenticated ? add.mutate() : router.push('/auth')} disabled={add.isPending}>
        {auth.isAuthenticated ? add.isPending ? 'Guardando...' : 'Agregar a biblioteca' : 'Iniciar sesion'}
      </PrimaryButton>

      <AppText tone="muted" style={styles.overview}>{series.overview ?? 'Sin sinopsis disponible.'}</AppText>
      <Chips title="Generos" items={series.genres} />
      <Chips title="Ratings externos" items={series.externalRatings.map((rating) => `${rating.label} ${formatRating(rating.value, rating.scale)}`)} />
      <Chips title="Donde ver" items={series.watchProviders.map((provider) => provider.name)} />
      <Chips title="Reparto" items={series.cast.slice(0, 10).map((person) => `${person.name}${person.role ? ` como ${person.role}` : ''}`)} />
      <MediaRail title="Tambien podria gustarte" items={series.recommendations} />
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
