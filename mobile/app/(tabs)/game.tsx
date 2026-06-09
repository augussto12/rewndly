import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Image, StyleSheet, TextInput, View } from 'react-native'
import { getHome } from '../../src/api/services'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

const maxAttempts = 5

export default function GameScreen() {
  const home = useQuery({ queryKey: ['home'], queryFn: getHome })
  const [guess, setGuess] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [won, setWon] = useState(false)
  const [roundOffset, setRoundOffset] = useState(0)
  const candidates = home.data?.trendingMovies?.filter((item) => item.posterUrl) ?? []
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

  if (!movie?.posterUrl) {
    return <Screen><EmptyState title="Sin juego" message="No encontramos posters para armar la ronda." /></Screen>
  }

  const revealed = won ? 9 : Math.min(9, 2 + attempts)

  return (
    <Screen>
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>Poster Quiz</AppText>
        <AppText tone="muted">Adivina la pelicula. Cada fallo libera otra parte del poster.</AppText>
      </View>

      <View style={styles.board}>
        <Image source={{ uri: movie.posterUrl }} style={styles.poster} blurRadius={won ? 0 : 8} />
        {Array.from({ length: 9 }).map((_, index) => index < revealed ? null : <View key={index} style={[styles.cover, cellStyle(index)]} />)}
      </View>

      <View style={styles.panel}>
        <AppText weight="semibold">{won ? `Era ${movie.title}` : `Intento ${attempts + 1}/${maxAttempts}`}</AppText>
        {!won && attempts >= maxAttempts ? <AppText tone="accent">Era {movie.title}</AppText> : null}
        <TextInput
          value={guess}
          onChangeText={setGuess}
          placeholder="Tu respuesta"
          placeholderTextColor={colors.faint}
          style={styles.input}
          editable={!won && attempts < maxAttempts}
        />
        <PrimaryButton onPress={won || attempts >= maxAttempts ? nextRound : submit}>
          {won || attempts >= maxAttempts ? 'Otra pelicula' : 'Probar'}
        </PrimaryButton>
      </View>
    </Screen>
  )
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
    fontSize: 34
  },
  board: {
    alignSelf: 'center',
    width: 270,
    height: 405,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  poster: {
    width: '100%',
    height: '100%'
  },
  cover: {
    position: 'absolute',
    width: '33.334%',
    height: '33.334%',
    backgroundColor: colors.panel
  },
  panel: {
    gap: 12,
    padding: 16,
    borderRadius: 18,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  input: {
    minHeight: 50,
    borderRadius: 12,
    paddingHorizontal: 14,
    backgroundColor: colors.bg,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16
  }
})
