import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { FlatList, Image, StyleSheet, View } from 'react-native'
import { getSeriesDetails } from '../../src/api/services'
import type { SeasonSummary } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { LibraryPanel } from '../../src/components/LibraryPanel'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { MediaDetailLayout } from '../../src/components/MediaDetailLayout'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { pickTrailer } from '../../src/lib/mediaFormat'
import { translateSeriesStatus } from '../../src/lib/seriesStatus'

export default function SeriesDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const tmdbId = Number(id)
  const details = useQuery({
    queryKey: ['series', tmdbId],
    queryFn: () => getSeriesDetails(tmdbId),
    enabled: Number.isFinite(tmdbId),
    staleTime: 1000 * 60 * 5
  })

  if (details.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!details.data) {
    return <Screen><EmptyState title="No encontramos esta serie" message="Proba volver e intentar de nuevo." /></Screen>
  }

  const series = details.data

  return (
    <Screen>
      <MediaDetailLayout
        title={series.name}
        subtitle={series.originalName !== series.name ? series.originalName : translateSeriesStatus(series.status)}
        backdropUrl={series.backdropUrl}
        posterUrl={series.posterUrl}
        metaItems={[
          series.firstAirDate?.slice(0, 4) ?? '',
          formatSeasons(series.numberOfSeasons),
          formatEpisodes(series.numberOfEpisodes),
          series.voteAverage ? `★ ${series.voteAverage.toFixed(1)}` : ''
        ]}
        genres={series.genres}
        overview={series.overview ?? null}
        trailer={pickTrailer(series.videos)}
        cast={series.cast}
        providers={series.watchProviders}
        externalRatings={series.externalRatings}
        recommendations={series.recommendations}
        similar={series.similar}
        libraryPanel={<LibraryPanel mediaType="Series" tmdbId={series.tmdbId} />}
        extra={<SeasonsSection seasons={series.seasons} />}
      />
    </Screen>
  )
}

function SeasonsSection({ seasons }: { seasons: SeasonSummary[] | undefined }) {
  const visibleSeasons = (seasons ?? []).filter((season) => season.seasonNumber > 0)
  if (!visibleSeasons.length) {
    return null
  }

  return (
    <View style={styles.section}>
      <AppText weight="bold" style={styles.sectionTitle}>Temporadas</AppText>
      <FlatList
        data={visibleSeasons}
        horizontal
        keyExtractor={(item) => String(item.tmdbId)}
        renderItem={({ item }) => <SeasonCard season={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.railContent}
      />
    </View>
  )
}

function SeasonCard({ season }: { season: SeasonSummary }) {
  return (
    <View style={styles.seasonCard}>
      <View style={styles.seasonPoster}>
        {season.posterUrl ? <Image source={{ uri: season.posterUrl }} style={styles.seasonImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin poster</AppText>}
      </View>
      <AppText weight="semibold" numberOfLines={1} style={styles.seasonName}>{season.name}</AppText>
      <AppText tone="muted" style={styles.seasonMeta}>
        {[season.airDate?.slice(0, 4), season.episodeCount ? `${season.episodeCount} eps.` : null].filter(Boolean).join('  ·  ') || 'Sin datos'}
      </AppText>
    </View>
  )
}

function formatSeasons(count: number | null) {
  if (!count) {
    return ''
  }
  return count === 1 ? '1 temporada' : `${count} temporadas`
}

function formatEpisodes(count: number | null) {
  if (!count) {
    return ''
  }
  return count === 1 ? '1 episodio' : `${count} episodios`
}

const styles = StyleSheet.create({
  section: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 23
  },
  railContent: {
    gap: 12,
    paddingRight: 8
  },
  seasonCard: {
    width: 116,
    gap: 6
  },
  seasonPoster: {
    width: 116,
    height: 174,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1
  },
  seasonImage: {
    width: '100%',
    height: '100%'
  },
  seasonName: {
    fontSize: 13,
    lineHeight: 17
  },
  seasonMeta: {
    fontSize: 11,
    lineHeight: 15
  }
})
