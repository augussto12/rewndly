import { useQuery } from '@tanstack/react-query'
import { useLocalSearchParams } from 'expo-router'
import { Image, StyleSheet, View } from 'react-native'
import { getPersonDetails } from '../../src/api/services'
import { AppText } from '../../src/components/AppText'
import { LoadingState, MediaRail } from '../../src/components/MediaComponents'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function PersonDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const tmdbId = Number(id)
  const details = useQuery({ queryKey: ['person', tmdbId], queryFn: () => getPersonDetails(tmdbId), enabled: Number.isFinite(tmdbId) })

  if (details.isLoading) {
    return <Screen><LoadingState /></Screen>
  }

  if (!details.data) {
    return <Screen><AppText>No encontramos esta persona.</AppText></Screen>
  }

  const person = details.data

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.photo}>
          {person.profileUrl ? <Image source={{ uri: person.profileUrl }} style={styles.photoImage} /> : <AppText tone="faint">Sin foto</AppText>}
        </View>
        <View style={{ flex: 1, gap: 8 }}>
          <AppText weight="bold" style={styles.title}>{person.name}</AppText>
          <AppText tone="muted">{person.knownForDepartment ?? 'Persona'}{person.birthday ? ` · ${person.birthday}` : ''}</AppText>
          {person.placeOfBirth ? <AppText tone="muted">{person.placeOfBirth}</AppText> : null}
        </View>
      </View>
      <AppText tone="muted" style={styles.bio}>{person.biography ?? 'Sin biografia disponible.'}</AppText>
      <MediaRail title="Peliculas" items={person.movieCredits ?? []} />
      <MediaRail title="Series" items={person.seriesCredits ?? []} />
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center'
  },
  photo: {
    width: 116,
    height: 154,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  photoImage: {
    width: '100%',
    height: '100%'
  },
  title: {
    fontSize: 30,
    lineHeight: 34
  },
  bio: {
    lineHeight: 23
  }
})
