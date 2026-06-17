import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LinearGradient } from 'expo-linear-gradient'
import { Link, useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { Alert, Image, Pressable, StyleSheet, TextInput, View } from 'react-native'
import { createList, getLibrary, getLists, getReviews, removeLibraryItem } from '../../src/api/services'
import type { AuthUser, LibraryItem, Review, UserList } from '../../src/api/types'
import { useAuth } from '../../src/auth/AuthProvider'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState } from '../../src/components/MediaComponents'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors, gradients } from '../../src/theme/colors'

type ProfileSection = 'profile' | 'library' | 'lists'
type StatusFilter = 'all' | 'WantToWatch' | 'Watching' | 'Watched' | 'Dropped'
type VisibilityFilter = 'all' | 'Public' | 'FriendsOnly' | 'Private'

const statusLabels: Record<string, string> = {
  all: 'Todo',
  WantToWatch: 'Quiero ver',
  Watching: 'Viendo',
  Watched: 'Vistas',
  Dropped: 'Abandonada'
}

const libraryFilters: StatusFilter[] = ['all', 'WantToWatch', 'Watching', 'Watched', 'Dropped']

export default function ProfileScreen() {
  const auth = useAuth()
  const router = useRouter()
  const params = useLocalSearchParams<{ section?: string }>()
  const queryClient = useQueryClient()
  const [section, setSection] = useState<ProfileSection>(() => parseSection(params.section))
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [visibilityFilter, setVisibilityFilter] = useState<VisibilityFilter>('all')
  const [title, setTitle] = useState('')
  const library = useQuery({ queryKey: ['library'], queryFn: getLibrary, enabled: auth.isAuthenticated, staleTime: 1000 * 60 })
  const lists = useQuery({ queryKey: ['lists'], queryFn: getLists, enabled: auth.isAuthenticated, staleTime: 1000 * 60 })
  const reviews = useQuery({ queryKey: ['reviews', 'profile'], queryFn: getReviews, enabled: auth.isAuthenticated, staleTime: 1000 * 60 })
  const create = useMutation({
    mutationFn: (listTitle: string) => createList(listTitle),
    onSuccess: async () => {
      setTitle('')
      await queryClient.invalidateQueries({ queryKey: ['lists'] })
    },
    onError: (error) => Alert.alert('No se pudo crear la lista', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })
  const remove = useMutation({
    mutationFn: removeLibraryItem,
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: ['library'] }),
    onError: (error) => Alert.alert('No se pudo quitar', error instanceof Error ? error.message : 'Intenta de nuevo.')
  })
  const items = library.data ?? []
  const counts = useMemo<Record<StatusFilter, number>>(() => ({
    all: items.length,
    WantToWatch: items.filter((item) => item.status === 'WantToWatch').length,
    Watching: items.filter((item) => item.status === 'Watching').length,
    Watched: items.filter((item) => item.status === 'Watched').length,
    Dropped: items.filter((item) => item.status === 'Dropped').length
  }), [items])
  const filteredItems = useMemo(() => {
    if (statusFilter === 'all') {
      return items
    }

    return items.filter((item) => item.status === statusFilter)
  }, [items, statusFilter])
  const visibleLists = useMemo(() => {
    const data = lists.data ?? []
    if (visibilityFilter === 'all') {
      return data
    }

    return data.filter((list) => list.visibility === visibilityFilter)
  }, [lists.data, visibilityFilter])

  useEffect(() => {
    setSection(parseSection(params.section))
  }, [params.section])

  if (auth.isLoading) {
    return <Screen><AppText>Cargando sesion...</AppText></Screen>
  }

  if (!auth.user) {
    return (
      <Screen>
        <View style={styles.card}>
          <AppText weight="bold" style={styles.title}>Entrar a Rewndly</AppText>
          <AppText tone="muted">Guarda peliculas, crea listas y sincroniza tu biblioteca entre web y app.</AppText>
          <PrimaryButton onPress={() => router.push('/auth')}>Iniciar sesion o registrarme</PrimaryButton>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <UserHeader user={auth.user} />

      <MetricsCard
        library={counts.all}
        watched={counts.Watched}
        watching={counts.Watching}
        lists={lists.data?.length ?? 0}
        reviews={reviews.data?.length ?? 0}
      />

      <View style={styles.segment}>
        <SegmentButton label="Perfil" active={section === 'profile'} onPress={() => setSection('profile')} />
        <SegmentButton label="Biblioteca" active={section === 'library'} onPress={() => setSection('library')} />
        <SegmentButton label="Listas" active={section === 'lists'} onPress={() => setSection('lists')} />
      </View>

      {section === 'profile' ? (
        <>
          <AccountSection user={auth.user} onLogout={auth.logout} />
          <ReviewsCard reviews={reviews.data ?? []} isLoading={reviews.isLoading} />
        </>
      ) : null}
      {section === 'library' ? (
        <LibrarySection
          isLoading={library.isLoading}
          counts={counts}
          filter={statusFilter}
          items={filteredItems}
          isRemoving={remove.isPending}
          onFilterChange={setStatusFilter}
          onRemove={(id) => remove.mutate(id)}
        />
      ) : null}
      {section === 'lists' ? (
        <ListsSection
          title={title}
          filter={visibilityFilter}
          lists={visibleLists}
          isLoading={lists.isLoading}
          isCreating={create.isPending}
          onTitleChange={setTitle}
          onFilterChange={setVisibilityFilter}
          onCreate={() => {
            const listTitle = title.trim()
            if (listTitle) {
              create.mutate(listTitle)
            }
          }}
        />
      ) : null}
    </Screen>
  )
}

function UserHeader({ user }: { user: AuthUser }) {
  return (
    <View style={styles.userCard}>
      <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
        <AppText weight="bold" style={styles.avatarText}>{user.displayName.slice(0, 1).toUpperCase()}</AppText>
      </LinearGradient>
      <View style={{ flex: 1, gap: 4 }}>
        <AppText weight="bold" style={styles.title}>{user.displayName}</AppText>
        <AppText tone="muted">@{user.username}</AppText>
        <AppText tone="muted" numberOfLines={1}>{user.email}</AppText>
      </View>
    </View>
  )
}

function AccountSection({ user, onLogout }: { user: AuthUser; onLogout: () => Promise<void> }) {
  return (
    <View style={styles.card}>
      <AppText tone="accent" weight="bold">CUENTA</AppText>
      <InfoRow label="Rol" value={user.role} />
      <InfoRow label="Correo" value={user.emailVerifiedAt ? 'Verificado' : 'Pendiente'} />
      <InfoRow label="Contrasena" value={user.mustChangePassword ? 'Cambio requerido' : 'Al dia'} />
      <PrimaryButton variant="secondary" onPress={onLogout}>Cerrar sesion</PrimaryButton>
    </View>
  )
}

function LibrarySection({
  isLoading,
  counts,
  filter,
  items,
  isRemoving,
  onFilterChange,
  onRemove
}: {
  isLoading: boolean
  counts: Record<StatusFilter, number>
  filter: StatusFilter
  items: LibraryItem[]
  isRemoving: boolean
  onFilterChange: (value: StatusFilter) => void
  onRemove: (id: string) => void
}) {
  const visibleItems = items.slice(0, 40)

  return (
    <>
      <View style={styles.filters}>
        {libraryFilters.map((status) => (
          <Chip key={status} label={`${statusLabels[status]} ${counts[status]}`} active={filter === status} onPress={() => onFilterChange(status)} />
        ))}
      </View>

      {isLoading ? <LoadingState /> : null}
      {!isLoading && !items.length ? <EmptyState title="Sin titulos" message={filter === 'all' ? 'Agrega contenido desde el detalle de una pelicula o serie.' : 'No hay titulos en este estado.'} /> : null}
      {visibleItems.map((item) => (
        <LibraryRow key={item.id} item={item} isRemoving={isRemoving} onRemove={() => onRemove(item.id)} />
      ))}
      {items.length > visibleItems.length ? <AppText tone="muted" style={styles.moreText}>Mostrando {visibleItems.length} de {items.length} titulos.</AppText> : null}
    </>
  )
}

function ListsSection({
  title,
  filter,
  lists,
  isLoading,
  isCreating,
  onTitleChange,
  onFilterChange,
  onCreate
}: {
  title: string
  filter: VisibilityFilter
  lists: UserList[]
  isLoading: boolean
  isCreating: boolean
  onTitleChange: (value: string) => void
  onFilterChange: (value: VisibilityFilter) => void
  onCreate: () => void
}) {
  const visibleLists = lists.slice(0, 30)

  return (
    <>
      <View style={styles.creator}>
        <TextInput
          value={title}
          onChangeText={onTitleChange}
          placeholder="Nueva lista"
          placeholderTextColor={colors.faint}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={onCreate}
        />
        <PrimaryButton onPress={onCreate} disabled={!title.trim() || isCreating}>
          {isCreating ? 'Creando...' : 'Crear lista'}
        </PrimaryButton>
      </View>

      <View style={styles.filters}>
        {(['all', 'Public', 'FriendsOnly', 'Private'] as VisibilityFilter[]).map((item) => (
          <Chip key={item} label={visibilityLabel(item)} active={filter === item} onPress={() => onFilterChange(item)} />
        ))}
      </View>

      {isLoading ? <LoadingState /> : null}
      {!isLoading && !lists.length ? <EmptyState title="Sin listas" message="Crea una lista o cambia el filtro." /> : null}
      {visibleLists.map((list) => <ListCard key={list.id} list={list} />)}
      {lists.length > visibleLists.length ? <AppText tone="muted" style={styles.moreText}>Mostrando {visibleLists.length} de {lists.length} listas.</AppText> : null}
    </>
  )
}

function LibraryRow({ item, isRemoving, onRemove }: { item: LibraryItem; isRemoving: boolean; onRemove: () => void }) {
  const href = item.mediaType === 'Movie' ? `/movie/${item.tmdbId}` : `/series/${item.tmdbId}`

  return (
    <View style={styles.item}>
      <Link href={href} asChild>
        <Pressable style={styles.poster}>{item.posterUrl ? <Image source={{ uri: item.posterUrl }} style={styles.posterImage} resizeMode="cover" fadeDuration={0} /> : null}</Pressable>
      </Link>
      <Link href={href} asChild>
        <Pressable style={styles.itemBody}>
          <AppText weight="semibold" numberOfLines={2}>{item.title}</AppText>
          <AppText tone="muted">{statusLabels[item.status] ?? item.status} / {item.rating ? `${item.rating}/10` : 'Sin puntuar'}</AppText>
          <AppText tone="faint">{item.mediaType === 'Movie' ? 'Pelicula' : 'Serie'}</AppText>
        </Pressable>
      </Link>
      <Pressable onPress={onRemove} disabled={isRemoving} style={styles.remove}>
        <AppText tone="muted">Quitar</AppText>
      </Pressable>
    </View>
  )
}

function ListCard({ list }: { list: UserList }) {
  return (
    <Link href={`/list/${list.id}`} asChild>
      <Pressable style={({ pressed }) => [styles.listCard, pressed ? { opacity: 0.8 } : null]}>
        <View style={{ flex: 1, gap: 6 }}>
          <AppText weight="bold" style={styles.cardTitle}>{list.title}</AppText>
          <AppText tone="muted" numberOfLines={2}>{list.description ?? 'Sin descripcion'}</AppText>
          <AppText tone="faint">{list.itemCount} titulos · {visibilityLabel(list.visibility)}</AppText>
        </View>
        <AppText tone="accent" weight="bold">Abrir</AppText>
      </Pressable>
    </Link>
  )
}

function ReviewsCard({ reviews, isLoading }: { reviews: Review[]; isLoading: boolean }) {
  const visible = reviews.slice(0, 8)

  return (
    <View style={styles.card}>
      <AppText tone="accent" weight="bold">MIS RESEÑAS</AppText>
      {isLoading ? <AppText tone="muted">Cargando...</AppText> : null}
      {!isLoading && !reviews.length ? <AppText tone="muted">Todavia no escribiste reseñas. Podes crearlas desde la web.</AppText> : null}
      {visible.map((review) => {
        const href = review.mediaType === 'Movie' ? `/movie/${review.tmdbId}` : `/series/${review.tmdbId}`
        return (
          <Link key={review.id} href={href} asChild>
            <Pressable style={({ pressed }) => [styles.reviewRow, pressed ? { opacity: 0.8 } : null]}>
              <AppText weight="semibold" numberOfLines={1}>{review.mediaTitle}</AppText>
              <AppText tone="muted" numberOfLines={1}>
                {review.title}{review.ratingSnapshot ? ` · ${review.ratingSnapshot}/10` : ''}
              </AppText>
              <AppText tone="faint" numberOfLines={2}>{review.body}</AppText>
            </Pressable>
          </Link>
        )
      })}
      {reviews.length > visible.length ? <AppText tone="muted" style={styles.moreText}>Mostrando {visible.length} de {reviews.length}.</AppText> : null}
    </View>
  )
}

function MetricsCard({ library, watched, watching, lists, reviews }: { library: number; watched: number; watching: number; lists: number; reviews: number }) {
  return (
    <View style={styles.metricsCard}>
      <AppText tone="accent" weight="bold">ACTIVIDAD</AppText>
      <View style={styles.metricsGrid}>
        <Metric label="Biblioteca" value={library} />
        <Metric label="Vistas" value={watched} />
        <Metric label="Viendo" value={watching} />
        <Metric label="Listas" value={lists} />
        <Metric label="Resenas" value={reviews} />
      </View>
    </View>
  )
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metric}>
      <AppText weight="bold" style={styles.metricValue}>{value}</AppText>
      <AppText tone="muted" numberOfLines={1} style={styles.metricLabel}>{label}</AppText>
    </View>
  )
}

function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentButton, active ? styles.segmentButtonActive : null]}>
      <AppText weight="bold" tone={active ? 'default' : 'muted'} style={styles.segmentText}>{label}</AppText>
    </Pressable>
  )
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active ? styles.chipActive : null]}>
      <AppText weight="bold" tone={active ? 'default' : 'muted'} style={styles.chipText}>{label}</AppText>
    </Pressable>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText tone="muted">{label}</AppText>
      <AppText weight="semibold">{value}</AppText>
    </View>
  )
}

function visibilityLabel(value: string) {
  if (value === 'all') {
    return 'Todas'
  }
  if (value === 'Public') {
    return 'Publicas'
  }
  if (value === 'FriendsOnly') {
    return 'Amigos'
  }
  return 'Privadas'
}

function parseSection(value: string | string[] | undefined): ProfileSection {
  const section = Array.isArray(value) ? value[0] : value
  return section === 'library' || section === 'lists' ? section : 'profile'
}

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  card: {
    gap: 14,
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 26
  },
  title: {
    fontSize: 24,
    lineHeight: 28
  },
  metricsCard: {
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  metric: {
    width: '31.5%',
    minHeight: 64,
    justifyContent: 'center',
    gap: 2,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.field,
    borderColor: colors.border,
    borderWidth: 1
  },
  metricValue: {
    fontSize: 22
  },
  metricLabel: {
    fontSize: 11
  },
  segment: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  segmentButton: {
    flex: 1,
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 7
  },
  segmentButtonActive: {
    backgroundColor: colors.accent
  },
  segmentText: {
    fontSize: 12
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: 1
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    minHeight: 38,
    justifyContent: 'center',
    borderRadius: 999,
    paddingHorizontal: 12,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    fontSize: 12
  },
  creator: {
    gap: 10,
    padding: 14,
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
  },
  item: {
    minHeight: 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  poster: {
    width: 52,
    height: 76,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.panelSoft,
    borderColor: 'rgba(255,255,255,0.10)',
    borderWidth: 1
  },
  posterImage: {
    width: '100%',
    height: '100%'
  },
  itemBody: {
    flex: 1,
    gap: 4
  },
  remove: {
    padding: 8
  },
  moreText: {
    textAlign: 'center'
  },
  listCard: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 8,
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1
  },
  cardTitle: {
    fontSize: 20
  },
  reviewRow: {
    gap: 3,
    paddingVertical: 10,
    borderTopColor: colors.border,
    borderTopWidth: 1
  }
})
