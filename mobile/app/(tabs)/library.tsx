import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useRouter } from 'expo-router'
import { Image, Pressable, StyleSheet, View } from 'react-native'
import { getLibrary, getLists, removeLibraryItem } from '../../src/api/services'
import { useAuth } from '../../src/auth/AuthProvider'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function LibraryScreen() {
  const auth = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const library = useQuery({ queryKey: ['library'], queryFn: getLibrary, enabled: auth.isAuthenticated })
  const lists = useQuery({ queryKey: ['lists'], queryFn: getLists, enabled: auth.isAuthenticated })
  const remove = useMutation({
    mutationFn: removeLibraryItem,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['library'] })
  })

  if (!auth.isAuthenticated) {
    return (
      <Screen>
        <EmptyState title="Tu espacio Rewndly" message="Inicia sesion para ver biblioteca, listas y puntuaciones." />
        <PrimaryButton onPress={() => router.push('/auth')}>Iniciar sesion</PrimaryButton>
      </Screen>
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>Biblioteca</AppText>
        <AppText tone="muted">Tus peliculas y series guardadas.</AppText>
      </View>

      {library.isLoading ? <LoadingState /> : null}
      {library.data?.length ? library.data.map((item) => (
        <Link key={item.id} href={item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`} asChild>
          <Pressable style={styles.item}>
            <View style={styles.poster}>{item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.posterImage} /> : null}</View>
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" numberOfLines={1}>{item.title}</AppText>
              <AppText tone="muted">{item.status} · {item.rating ? `${item.rating}/10` : 'Sin puntuar'}</AppText>
            </View>
            <Pressable onPress={() => remove.mutate(item.id)} style={styles.remove}>
              <AppText tone="muted">Quitar</AppText>
            </Pressable>
          </Pressable>
        </Link>
      )) : !library.isLoading ? <EmptyState title="Sin biblioteca" message="Agrega contenido desde el detalle de una pelicula o serie." /> : null}

      <View style={styles.section}>
        <AppText weight="bold" style={styles.sectionTitle}>Listas</AppText>
        {lists.data?.length ? lists.data.map((list) => (
          <View key={list.id} style={styles.listRow}>
            <View>
              <AppText weight="semibold">{list.title}</AppText>
              <AppText tone="muted">{list.itemCount} items · {list.visibility}</AppText>
            </View>
          </View>
        )) : <AppText tone="muted">Todavia no tenes listas.</AppText>}
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6
  },
  title: {
    fontSize: 34
  },
  item: {
    minHeight: 84,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  poster: {
    width: 44,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft
  },
  posterImage: {
    width: '100%',
    height: '100%'
  },
  remove: {
    padding: 8
  },
  section: {
    gap: 10
  },
  sectionTitle: {
    fontSize: 22
  },
  listRow: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  }
})
