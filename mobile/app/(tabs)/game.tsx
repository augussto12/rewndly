import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Image, StyleSheet, TextInput, View } from 'react-native'
import { getHome } from '../../src/api/services'
import type { MediaSummary } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'
import { rf } from '../../src/theme/typography'

const maxAttempts = 5

export default function GameScreen() {
  const home = useQuery({ queryKey: ['home'], queryFn: getHome, staleTime: 1000 * 60 * 5 })
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [won, setWon] = useState(false)
  const [roundOffset, setRoundOffset] = useState(0)
  const candidates = useMemo(() => uniqueMedia([
    ...(home.data?.trendingMovies ?? []),
    ...(home.data?.popularMovies ?? []),
    ...(home.data?.nowPlayingMovies ?? [])
  ]).filter((item) => item.posterUrl), [home.data])
  const movie = useMemo(() => candidates.length ? candidates[(dayIndex() + roundOffset) % candidates.length] : null, [candidates, roundOffset])

  function submit() {
    if (!movie || won) {
      return
    }

    const normalizedGuess = normalize(guess)
    if (normalizedGuess && normalize(movie.title).includes(normalizedGuess)) {
      setWon(true)
      return
    }

    setAttempts((value) => Math.min(maxAttempts, value + 1))
    setGuess('')
  }

  function nextRound() {
    setRoundOffset((value) => value + 1)
    setAttempts(0)
    setWon(false)
    setGuess('')
  }

  if (home.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (home.isError) {
    return <Screen><EmptyState title="No pudimos cargar el juego" message="No llegaron los posters de la portada." /></Screen>
  }

  if (!movie?.posterUrl) {
    return <Screen><EmptyState title="Sin poster" message="No encontramos posters para armar la ronda." /></Screen>
  }

  const revealed = won ? 9 : Math.min(9, 3 + attempts)
  const finished = won || attempts >= maxAttempts

  return (
    <Screen>
      <View style={styles.header}>
        <AppText tone="accent" weight="bold">JUEGOS</AppText>
        <AppText weight="bold" style={styles.title}>Posterle</AppText>
        <AppText tone="muted">Adivina la pelicula. Cada intento revela un poco mas del poster.</AppText>
      </View>

      <View style={styles.board}>
        <Image source={{ uri: movie.posterUrl }} style={styles.poster} resizeMode="cover" blurRadius={won ? 0 : 7} fadeDuration={0} />
        {Array.from({ length: 9 }).map((_, index) => index < revealed ? null : <View key={index} style={[styles.cover, cellStyle(index)]} />)}
      </View>

      <View style={styles.panel}>
        <AppText weight="semibold">{won ? `Era ${movie.title}` : `Intento ${Math.min(attempts + 1, maxAttempts)}/${maxAttempts}`}</AppText>
        {!won && attempts >= maxAttempts ? <AppText tone="accent">Era {movie.title}</AppText> : null}
        <TextInput
          value={guess}
          onChangeText={setGuess}
          placeholder="Tu respuesta"
          placeholderTextColor={colors.faint}
          style={styles.input}
          editable={!finished}
          returnKeyType="done"
          onSubmitEditing={finished ? nextRound : submit}
        />
        <PrimaryButton onPress={finished ? nextRound : submit}>
          {finished ? 'Otra pelicula' : 'Probar'}
        </PrimaryButton>
      </View>
    </Screen>
  )
}

function uniqueMedia(items: MediaSummary[]) {
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

function normalize(value: string) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function dayIndex() {
  return Math.floor(Date.now() / 86_400_000)
}

function cellStyle(index: number) {
  const row = Math.floor(index / 3)
  const col = index % 3
  return {
    left: `${col * 33.333}%` as const,
    top: `${row * 33.333}%` as const
  }
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    fontSize: rf(32),
    lineHeight: rf(36)
  },
  board: {
    alignSelf: 'center',
    width: '72%',
    maxWidth: 270,
    minWidth: 220,
    aspectRatio: 2 / 3,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    shadowColor: colors.shadow,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4
  },
  poster: {
    width: '100%',
    height: '100%'
  },
  cover: {
    position: 'absolute',
    width: '33.334%',
    height: '33.334%',
    backgroundColor: 'rgba(17,20,35,0.56)',
    borderColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1
  },
  panel: {
    gap: 12,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  input: {
    minHeight: 50,
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16
  }
})
