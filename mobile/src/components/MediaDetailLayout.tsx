import { LinearGradient } from 'expo-linear-gradient'
import type { ReactNode } from 'react'
import { Image, Linking, Pressable, StyleSheet, View } from 'react-native'
import type { ExternalRating, MediaPerson, MediaSummary, MediaVideo, WatchProvider } from '../api/types'
import { colors, gradients } from '../theme/colors'
import { rf } from '../theme/typography'
import { AppText } from './AppText'
import { CastRail, MediaRail } from './MediaComponents'

type MediaDetailLayoutProps = {
  title: string
  subtitle?: string | null
  backdropUrl: string | null
  posterUrl: string | null
  metaItems: string[]
  genres: string[]
  overview: string | null
  trailer?: MediaVideo
  cast: MediaPerson[]
  providers: WatchProvider[]
  externalRatings: ExternalRating[]
  recommendations: MediaSummary[]
  similar: MediaSummary[]
  libraryPanel: ReactNode
  extra?: ReactNode
}

export function MediaDetailLayout({
  title,
  subtitle,
  backdropUrl,
  posterUrl,
  metaItems,
  genres,
  overview,
  trailer,
  cast,
  providers,
  externalRatings,
  recommendations,
  similar,
  libraryPanel,
  extra
}: MediaDetailLayoutProps) {
  const meta = metaItems.filter(Boolean).join('  ·  ')

  return (
    <>
      <View style={styles.hero}>
        <View style={styles.backdrop}>
          {backdropUrl ? <Image source={{ uri: backdropUrl }} style={styles.backdropImage} resizeMode="cover" fadeDuration={0} /> : null}
          <LinearGradient colors={gradients.heroOverlay} style={StyleSheet.absoluteFill} />
        </View>
        <View style={styles.heroBody}>
          <View style={styles.poster}>
            {posterUrl ? <Image source={{ uri: posterUrl }} style={styles.posterImage} resizeMode="cover" fadeDuration={0} /> : <AppText tone="faint">Sin poster</AppText>}
          </View>
          <View style={styles.heroInfo}>
            <AppText weight="bold" style={styles.title}>{title}</AppText>
            {subtitle ? <AppText tone="muted" numberOfLines={2} style={styles.subtitle}>{subtitle}</AppText> : null}
            {meta ? <AppText tone="muted" style={styles.meta}>{meta}</AppText> : null}
          </View>
        </View>
      </View>

      {genres.length ? (
        <View style={styles.genreRow}>
          {genres.map((genre) => <View key={genre} style={styles.genreChip}><AppText style={styles.genreText}>{genre}</AppText></View>)}
        </View>
      ) : null}

      {trailer ? (
        <Pressable
          onPress={() => Linking.openURL(`https://www.youtube.com/watch?v=${trailer.key}`)}
          style={({ pressed }) => [styles.trailer, pressed ? { opacity: 0.85 } : null]}
        >
          <AppText weight="bold" style={styles.trailerIcon}>▶</AppText>
          <View style={{ flex: 1 }}>
            <AppText weight="bold">Ver trailer</AppText>
            <AppText tone="muted" numberOfLines={1}>{trailer.name}</AppText>
          </View>
        </Pressable>
      ) : null}

      {overview ? <AppText style={styles.overview}>{overview}</AppText> : null}

      {libraryPanel}

      {extra}

      <CastRail title="Reparto" cast={cast} />

      {externalRatings.length ? (
        <Section title="Ratings externos">
          <View style={styles.chips}>
            {externalRatings.map((rating) => (
              <View key={rating.source} style={styles.dataChip}>
                <AppText weight="semibold" style={styles.dataChipText}>{rating.label} {formatRating(rating.value, rating.scale)}</AppText>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      {providers.length ? (
        <Section title="Donde ver">
          <View style={styles.chips}>
            {dedupeProviders(providers).map((provider) => (
              <View key={`${provider.type}-${provider.providerId}`} style={styles.providerChip}>
                {provider.logoUrl ? <Image source={{ uri: provider.logoUrl }} style={styles.providerLogo} resizeMode="cover" fadeDuration={0} /> : null}
                <AppText weight="semibold" style={styles.dataChipText}>{provider.name}</AppText>
              </View>
            ))}
          </View>
        </Section>
      ) : null}

      <MediaRail title="Recomendaciones" items={recommendations} />
      <MediaRail title="Similares" items={similar} />
    </>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      {children}
    </View>
  )
}

function formatRating(value: number, scale: number) {
  return scale === 100 ? `${Math.round(value)}%` : `${value.toFixed(1)}/${scale}`
}

function dedupeProviders(providers: WatchProvider[]) {
  const seen = new Set<number>()
  return providers.filter((provider) => {
    if (seen.has(provider.providerId)) {
      return false
    }
    seen.add(provider.providerId)
    return true
  })
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  backdrop: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.panelSoft
  },
  backdropImage: {
    width: '100%',
    height: '100%'
  },
  heroBody: {
    flexDirection: 'row',
    gap: 14,
    padding: 14,
    marginTop: -56
  },
  poster: {
    width: 96,
    aspectRatio: 2 / 3,
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panelSoft,
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1
  },
  posterImage: {
    width: '100%',
    height: '100%'
  },
  heroInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'flex-end'
  },
  title: {
    fontSize: rf(24),
    lineHeight: rf(28)
  },
  subtitle: {
    fontSize: 13,
    fontStyle: 'italic'
  },
  meta: {
    fontSize: 13
  },
  genreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  genreChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.accentSoft,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  genreText: {
    fontSize: 12
  },
  trailer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  trailerIcon: {
    fontSize: 18,
    color: colors.accent2
  },
  overview: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted
  },
  section: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 23
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  dataChip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  dataChipText: {
    fontSize: 13
  },
  providerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  providerLogo: {
    width: 22,
    height: 22,
    borderRadius: 6
  }
})
