import { LinearGradient } from 'expo-linear-gradient'
import { Link } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Dimensions, FlatList, ImageBackground, Pressable, StyleSheet, View } from 'react-native'
import type { NativeScrollEvent, NativeSyntheticEvent } from 'react-native'
import type { MediaSummary } from '../api/types'
import { colors, gradients } from '../theme/colors'
import { rf } from '../theme/typography'
import { AppText } from './AppText'

const SCREEN_PADDING = 18
const SLIDE_WIDTH = Dimensions.get('window').width
const ROTATE_MS = 5000

export function FeaturedCarousel({ items }: { items: MediaSummary[] }) {
  const data = items.slice(0, 6)
  const listRef = useRef<FlatList<MediaSummary>>(null)
  const indexRef = useRef(0)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (data.length < 2) {
      return
    }

    const timer = setInterval(() => {
      const next = (indexRef.current + 1) % data.length
      indexRef.current = next
      setIndex(next)
      listRef.current?.scrollToOffset({ offset: next * SLIDE_WIDTH, animated: true })
    }, ROTATE_MS)

    return () => clearInterval(timer)
  }, [data.length])

  if (!data.length) {
    return null
  }

  function onScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = Math.round(event.nativeEvent.contentOffset.x / SLIDE_WIDTH)
    indexRef.current = next
    setIndex(next)
  }

  return (
    <View style={styles.wrapper}>
      <FlatList
        ref={listRef}
        data={data}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => `${item.mediaType}-${item.tmdbId}`}
        renderItem={({ item }) => <FeaturedSlide item={item} />}
        onMomentumScrollEnd={onScrollEnd}
        getItemLayout={(_, i) => ({ length: SLIDE_WIDTH, offset: SLIDE_WIDTH * i, index: i })}
      />
      {data.length > 1 ? (
        <View style={styles.dots}>
          {data.map((item, i) => (
            <View key={`${item.mediaType}-${item.tmdbId}`} style={[styles.dot, i === index ? styles.dotActive : null]} />
          ))}
        </View>
      ) : null}
    </View>
  )
}

function FeaturedSlide({ item }: { item: MediaSummary }) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`
  const visual = item.backdropUrl ?? item.posterUrl ?? undefined
  const copy = (
    <LinearGradient colors={gradients.heroOverlay} style={styles.overlay}>
      <AppText tone="accent" weight="bold">Destacada</AppText>
      <AppText weight="bold" style={styles.title} numberOfLines={2}>{item.title}</AppText>
      <AppText tone="muted" numberOfLines={3}>{item.overview ?? 'Sinopsis no disponible.'}</AppText>
      <AppText tone="muted">{item.voteAverage ? `★ ${item.voteAverage.toFixed(1)}` : 'Sin rating'} · {item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}</AppText>
    </LinearGradient>
  )

  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => [styles.slide, pressed ? { opacity: 0.9 } : null]}>
        <View style={styles.card}>
          {visual ? (
            <ImageBackground source={{ uri: visual }} style={styles.image} imageStyle={styles.imageRadius} resizeMode="cover">
              {copy}
            </ImageBackground>
          ) : copy}
        </View>
      </Pressable>
    </Link>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 12,
    marginHorizontal: -SCREEN_PADDING
  },
  slide: {
    width: SLIDE_WIDTH,
    paddingHorizontal: SCREEN_PADDING
  },
  card: {
    minHeight: 280,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end'
  },
  imageRadius: {
    borderRadius: 14
  },
  overlay: {
    gap: 8,
    padding: 18,
    minHeight: 190,
    justifyContent: 'flex-end'
  },
  title: {
    fontSize: rf(26),
    lineHeight: rf(30)
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 7
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.border
  },
  dotActive: {
    width: 20,
    backgroundColor: colors.accent2
  }
})
