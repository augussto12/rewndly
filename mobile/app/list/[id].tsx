import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native'
import {
  addListItem,
  deleteList,
  deleteListItem,
  getListDetails,
  searchAll,
  updateList
} from '../../src/api/services'
import type { MediaSummary, UserListItem, Visibility } from '../../src/api/types'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

const visibilityOptions: Array<{ value: Visibility; label: string }> = [
  { value: 'Public', label: 'Publica' },
  { value: 'FriendsOnly', label: 'Amigos' },
  { value: 'Private', label: 'Privada' }
]

export default function ListDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const list = useQuery({ queryKey: ['list', id], queryFn: () => getListDetails(id), enabled: Boolean(id) })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 280)
    return () => clearTimeout(timer)
  }, [query])

  const normalizedQuery = debouncedQuery.trim()
  const search = useQuery({
    queryKey: ['list-search', normalizedQuery],
    queryFn: () => searchAll(normalizedQuery),
    enabled: normalizedQuery.length >= 2,
    staleTime: 1000 * 60
  })
  const searchResults = useMemo(
    () => [...(search.data?.movies ?? []).slice(0, 6), ...(search.data?.series ?? []).slice(0, 6)],
    [search.data?.movies, search.data?.series]
  )

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['list', id] })
    queryClient.invalidateQueries({ queryKey: ['lists'] })
  }

  const add = useMutation({
    mutationFn: (item: MediaSummary) => addListItem(id, item.mediaType, item.tmdbId),
    onSuccess: invalidate,
    onError: (error) => Alert.alert('No se pudo agregar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })
  const removeItem = useMutation({
    mutationFn: (itemId: string) => deleteListItem(id, itemId),
    onSuccess: invalidate,
    onError: (error) => Alert.alert('No se pudo quitar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })
  const removeList = useMutation({
    mutationFn: () => deleteList(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lists'] })
      router.back()
    },
    onError: (error) => Alert.alert('No se pudo eliminar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })

  if (list.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!list.data) {
    return <Screen><EmptyState title="Lista no encontrada" message="Proba volver a tus listas." /></Screen>
  }

  const data = list.data
  const itemKeys = new Set(data.items.map((item) => `${item.mediaType}-${item.tmdbId}`))

  function confirmDelete() {
    Alert.alert('Eliminar lista', `Seguro que queres eliminar "${data.title}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: () => removeList.mutate() }
    ])
  }

  return (
    <Screen>
      {isEditing ? (
        <ListEditor
          initialTitle={data.title}
          initialDescription={data.description ?? ''}
          initialVisibility={(data.visibility as Visibility) ?? 'Private'}
          listId={id}
          onCancel={() => setIsEditing(false)}
          onSaved={() => {
            setIsEditing(false)
            invalidate()
          }}
        />
      ) : (
        <View style={styles.headerCard}>
          <AppText tone="accent" weight="bold">{visibilityLabel(data.visibility)}</AppText>
          <AppText weight="bold" style={styles.title}>{data.title}</AppText>
          {data.description ? <AppText tone="muted">{data.description}</AppText> : null}
          <AppText tone="faint">{data.items.length} titulos</AppText>
          <View style={styles.headerActions}>
            <PrimaryButton variant="secondary" onPress={() => setIsEditing(true)}>Editar</PrimaryButton>
            <PrimaryButton variant="ghost" onPress={confirmDelete} disabled={removeList.isPending}>Eliminar lista</PrimaryButton>
          </View>
        </View>
      )}

      <View style={styles.searchCard}>
        <AppText weight="bold">Agregar titulos</AppText>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar pelicula o serie"
          placeholderTextColor={colors.faint}
          autoCapitalize="none"
          returnKeyType="search"
          style={styles.input}
        />
        {normalizedQuery.length >= 2 ? (
          <View style={styles.results}>
            {search.isLoading ? <AppText tone="muted">Buscando...</AppText> : null}
            {!search.isLoading && !searchResults.length ? <AppText tone="muted">Sin resultados.</AppText> : null}
            {searchResults.map((item) => {
              const inList = itemKeys.has(`${item.mediaType}-${item.tmdbId}`)
              return (
                <Pressable
                  key={`${item.mediaType}-${item.tmdbId}`}
                  onPress={() => !inList && add.mutate(item)}
                  disabled={inList || add.isPending}
                  style={({ pressed }) => [styles.resultRow, pressed ? { opacity: 0.75 } : null]}
                >
                  <View style={styles.thumb}>
                    {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.fill} resizeMode="cover" fadeDuration={0} /> : null}
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" numberOfLines={1}>{item.title}</AppText>
                    <AppText tone="muted" numberOfLines={1}>
                      {item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}{item.releaseDate ? ` · ${item.releaseDate.slice(0, 4)}` : ''}
                    </AppText>
                  </View>
                  <AppText tone={inList ? 'faint' : 'accent'} weight="bold">{inList ? 'Agregada' : 'Agregar'}</AppText>
                </Pressable>
              )
            })}
          </View>
        ) : null}
      </View>

      {!data.items.length ? (
        <EmptyState title="Lista vacia" message="Busca titulos arriba para sumarlos a esta lista." />
      ) : (
        data.items.map((item) => (
          <ListItemRow key={item.id} item={item} isRemoving={removeItem.isPending} onRemove={() => removeItem.mutate(item.id)} />
        ))
      )}
    </Screen>
  )
}

function ListEditor({
  initialTitle,
  initialDescription,
  initialVisibility,
  listId,
  onCancel,
  onSaved
}: {
  initialTitle: string
  initialDescription: string
  initialVisibility: Visibility
  listId: string
  onCancel: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility)
  const save = useMutation({
    mutationFn: () => updateList(listId, { title: title.trim(), description: description.trim() || null, visibility }),
    onSuccess: onSaved,
    onError: (error) => Alert.alert('No se pudo guardar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })

  return (
    <View style={styles.headerCard}>
      <AppText weight="bold" style={styles.title}>Editar lista</AppText>
      <TextInput value={title} onChangeText={setTitle} placeholder="Titulo" placeholderTextColor={colors.faint} style={styles.input} />
      <TextInput
        value={description}
        onChangeText={setDescription}
        placeholder="Descripcion (opcional)"
        placeholderTextColor={colors.faint}
        multiline
        style={[styles.input, styles.textArea]}
      />
      <View style={styles.chips}>
        {visibilityOptions.map((option) => (
          <Pressable key={option.value} onPress={() => setVisibility(option.value)} style={[styles.chip, visibility === option.value ? styles.chipActive : null]}>
            <AppText weight="bold" tone={visibility === option.value ? 'default' : 'muted'} style={styles.chipText}>{option.label}</AppText>
          </Pressable>
        ))}
      </View>
      <View style={styles.headerActions}>
        <PrimaryButton onPress={() => save.mutate()} disabled={!title.trim() || save.isPending}>
          {save.isPending ? 'Guardando...' : 'Guardar'}
        </PrimaryButton>
        <PrimaryButton variant="ghost" onPress={onCancel}>Cancelar</PrimaryButton>
      </View>
    </View>
  )
}

function ListItemRow({ item, isRemoving, onRemove }: { item: UserListItem; isRemoving: boolean; onRemove: () => void }) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`

  return (
    <View style={styles.itemRow}>
      <Link href={href} asChild>
        <Pressable style={styles.itemPoster}>
          {item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.fill} resizeMode="cover" fadeDuration={0} /> : null}
        </Pressable>
      </Link>
      <Link href={href} asChild>
        <Pressable style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={2}>{item.title}</AppText>
          <AppText tone="muted">{item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}{item.rating ? ` · ${item.rating}/10` : ''}</AppText>
        </Pressable>
      </Link>
      <Pressable onPress={onRemove} disabled={isRemoving} style={styles.remove}>
        <AppText tone="muted">Quitar</AppText>
      </Pressable>
    </View>
  )
}

function visibilityLabel(value: string) {
  if (value === 'Public') {
    return 'Publica'
  }
  if (value === 'FriendsOnly') {
    return 'Amigos'
  }
  return 'Privada'
}

const styles = StyleSheet.create({
  headerCard: {
    gap: 10,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  title: {
    fontSize: 24,
    lineHeight: 28
  },
  headerActions: {
    flexDirection: 'row',
    gap: 10
  },
  searchCard: {
    gap: 10,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  input: {
    minHeight: 48,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  results: {
    gap: 8
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
    borderRadius: 10,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1
  },
  thumb: {
    width: 38,
    height: 57,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft
  },
  chips: {
    flexDirection: 'row',
    gap: 8
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.field,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    fontSize: 13
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  itemPoster: {
    width: 48,
    height: 72,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1
  },
  remove: {
    padding: 8
  },
  fill: {
    width: '100%',
    height: '100%'
  }
})
