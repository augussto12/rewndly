import { useQuery } from '@tanstack/react-query'
import type { ComponentProps } from 'react'
import { useMemo, useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { searchAll } from '../../src/api/services'
import { AppText } from '../../src/components/AppText'
import { EmptyState, LoadingState, MediaCard, PersonCard } from '../../src/components/MediaComponents'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function SearchScreen() {
  const [query, setQuery] = useState('')
  const normalized = useMemo(() => query.trim(), [query])
  const results = useQuery({
    queryKey: ['search', normalized],
    queryFn: () => searchAll(normalized),
    enabled: normalized.length >= 2
  })

  return (
    <Screen>
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>Buscar</AppText>
        <AppText tone="muted">Peliculas, series y personas en un solo lugar.</AppText>
      </View>

      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Nombre, actor, serie..."
        placeholderTextColor={colors.faint}
        autoCapitalize="none"
        style={styles.input}
      />

      {normalized.length < 2 ? <EmptyState title="Escribi algo" message="Con dos letras ya buscamos en todo Rewndly." /> : null}
      {results.isLoading ? <LoadingState /> : null}

      {results.data ? (
        <>
          <ResultGrid title="Peliculas" items={results.data.movies} />
          <ResultGrid title="Series" items={results.data.series} />
          <View style={styles.section}>
            <AppText weight="bold" style={styles.sectionTitle}>Personas</AppText>
            {results.data.people.length ? results.data.people.slice(0, 8).map((person) => <PersonCard key={person.tmdbId} item={person} />) : <AppText tone="muted">Sin personas.</AppText>}
          </View>
        </>
      ) : null}
    </Screen>
  )
}

function ResultGrid({ title, items }: { title: string; items: Array<ComponentProps<typeof MediaCard>['item']> }) {
  return (
    <View style={styles.section}>
      <AppText weight="bold" style={styles.sectionTitle}>{title}</AppText>
      {items.length ? (
        <View style={styles.grid}>
          {items.slice(0, 8).map((item) => <MediaCard key={`${item.mediaType}-${item.tmdbId}`} item={item} />)}
        </View>
      ) : <AppText tone="muted">Sin resultados.</AppText>}
    </View>
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 6
  },
  title: {
    fontSize: 34
  },
  input: {
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    color: colors.text,
    fontSize: 16
  },
  section: {
    gap: 12
  },
  sectionTitle: {
    fontSize: 20
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14
  }
})
