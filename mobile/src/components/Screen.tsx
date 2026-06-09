import type { PropsWithChildren } from 'react'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

export function Screen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </SafeAreaView>
  )
}

export function StaticScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.staticContent}>{children}</View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  content: {
    padding: 18,
    paddingBottom: 120,
    gap: 18
  },
  staticContent: {
    flex: 1,
    padding: 18
  }
})
