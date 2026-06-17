import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native'
import { createLibraryItem, getLibrary, removeLibraryItem, updateLibraryItem } from '../api/services'
import type { LibraryItem, LibraryItemRequest, WatchStatus } from '../api/types'
import { useAuth } from '../auth/AuthProvider'
import { colors } from '../theme/colors'
import { AppText } from './AppText'
import { PrimaryButton } from './PrimaryButton'

const statusOptions: Array<{ value: WatchStatus; label: string }> = [
  { value: 'WantToWatch', label: 'Quiero ver' },
  { value: 'Watching', label: 'Viendo' },
  { value: 'Watched', label: 'Vista' },
  { value: 'Dropped', label: 'Abandonada' }
]

const ratingValues = Array.from({ length: 10 }, (_, index) => index + 1)

export function LibraryPanel({ mediaType, tmdbId }: { mediaType: 'Movie' | 'Series'; tmdbId: number }) {
  const auth = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const library = useQuery({ queryKey: ['library'], queryFn: getLibrary, enabled: auth.isAuthenticated, staleTime: 1000 * 60 })
  const existing = useMemo(
    () => library.data?.find((item) => item.mediaType === mediaType && item.tmdbId === tmdbId),
    [library.data, mediaType, tmdbId]
  )

  if (!auth.isAuthenticated) {
    return (
      <View style={styles.panel}>
        <AppText tone="accent" weight="bold">TU BIBLIOTECA</AppText>
        <AppText tone="muted">Inicia sesion para guardar estado, rating y favoritos.</AppText>
        <PrimaryButton onPress={() => router.push('/auth')}>Iniciar sesion</PrimaryButton>
      </View>
    )
  }

  if (library.isLoading) {
    return (
      <View style={styles.panel}>
        <AppText tone="muted">Cargando tu biblioteca...</AppText>
      </View>
    )
  }

  return (
    <LibraryEditor
      key={existing?.id ?? `new-${mediaType}-${tmdbId}`}
      mediaType={mediaType}
      tmdbId={tmdbId}
      existing={existing}
      onChanged={() => queryClient.invalidateQueries({ queryKey: ['library'] })}
    />
  )
}

function LibraryEditor({
  mediaType,
  tmdbId,
  existing,
  onChanged
}: {
  mediaType: 'Movie' | 'Series'
  tmdbId: number
  existing: LibraryItem | undefined
  onChanged: () => void
}) {
  const [status, setStatus] = useState<WatchStatus>((existing?.status as WatchStatus) ?? 'WantToWatch')
  const [rating, setRating] = useState<number | null>(existing?.rating ?? null)
  const [isFavorite, setIsFavorite] = useState(existing?.isFavorite ?? false)

  const save = useMutation({
    mutationFn: () => {
      const request: LibraryItemRequest = {
        mediaType,
        tmdbId,
        status,
        isFavorite,
        rating: status === 'Watched' ? rating : null,
        watchedAt: status === 'Watched' ? new Date().toISOString() : null,
        startedAt: status === 'Watching' ? new Date().toISOString() : null
      }

      return existing ? updateLibraryItem(existing.id, request) : createLibraryItem(request)
    },
    onSuccess: onChanged,
    onError: (error) => Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })
  const remove = useMutation({
    mutationFn: () => removeLibraryItem(existing!.id),
    onSuccess: onChanged,
    onError: (error) => Alert.alert('No se pudo quitar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })

  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <AppText tone="accent" weight="bold">TU BIBLIOTECA</AppText>
        {existing ? <AppText tone="muted">Guardada</AppText> : null}
      </View>

      <View style={styles.chips}>
        {statusOptions.map((option) => (
          <Chip key={option.value} label={option.label} active={status === option.value} onPress={() => setStatus(option.value)} />
        ))}
      </View>

      {status === 'Watched' ? (
        <View style={styles.ratingBlock}>
          <AppText tone="muted">Tu puntaje{rating ? `: ${rating}/10` : ''}</AppText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.ratingRow}>
            {ratingValues.map((value) => (
              <Chip key={value} label={String(value)} active={rating === value} onPress={() => setRating(value)} compact />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <Pressable onPress={() => setIsFavorite((value) => !value)} style={styles.favoriteRow}>
        <View style={[styles.checkbox, isFavorite ? styles.checkboxActive : null]}>
          {isFavorite ? <AppText weight="bold" style={styles.checkboxMark}>✓</AppText> : null}
        </View>
        <AppText>Marcar como favorita</AppText>
      </Pressable>

      <PrimaryButton onPress={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Guardando...' : existing ? 'Actualizar biblioteca' : 'Guardar en biblioteca'}
      </PrimaryButton>
      {existing ? (
        <PrimaryButton variant="ghost" onPress={() => remove.mutate()} disabled={remove.isPending}>
          {remove.isPending ? 'Quitando...' : 'Quitar de biblioteca'}
        </PrimaryButton>
      ) : null}
    </View>
  )
}

function Chip({ label, active, onPress, compact }: { label: string; active: boolean; onPress: () => void; compact?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, compact ? styles.chipCompact : null, active ? styles.chipActive : null]}>
      <AppText weight="bold" tone={active ? 'default' : 'muted'} style={styles.chipText}>{label}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  panel: {
    gap: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    minHeight: 40,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  chipCompact: {
    minWidth: 44,
    paddingHorizontal: 0,
    alignItems: 'center'
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    fontSize: 13
  },
  ratingBlock: {
    gap: 8
  },
  ratingRow: {
    gap: 8,
    paddingVertical: 2
  },
  favoriteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  checkboxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  checkboxMark: {
    fontSize: 14,
    color: colors.text
  }
})
