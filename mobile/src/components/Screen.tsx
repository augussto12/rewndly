import type { PropsWithChildren } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, gradients } from '../theme/colors'

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <LinearGradient colors={gradients.appBackground} style={styles.background}>
        <LinearGradient pointerEvents="none" colors={['rgba(45,212,191,0.16)', 'rgba(45,212,191,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topWash} />
        <LinearGradient pointerEvents="none" colors={['rgba(124,58,237,0)', 'rgba(124,58,237,0.16)', 'rgba(124,58,237,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.midWash} />
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  )
}

export function StaticScreen({ children }: PropsWithChildren) {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safe}>
      <LinearGradient colors={gradients.appBackground} style={styles.background}>
        <LinearGradient pointerEvents="none" colors={['rgba(45,212,191,0.14)', 'rgba(45,212,191,0)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topWash} />
        <View style={styles.staticContent}>{children}</View>
      </LinearGradient>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg
  },
  background: {
    flex: 1
  },
  topWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '28%'
  },
  midWash: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '34%',
    height: '24%'
  },
  content: {
    padding: 18,
    gap: 18
  },
  staticContent: {
    flex: 1,
    padding: 18
  }
})
