import type { PropsWithChildren } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { ScrollView, StyleSheet, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { colors, gradients } from '../theme/colors'

export function Screen({ children }: PropsWithChildren) {
  const insets = useSafeAreaInsets()

  return (
    <View style={styles.root}>
      <Background />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.flex}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 108 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

export function StaticScreen({ children }: PropsWithChildren) {
  return (
    <View style={styles.root}>
      <Background />
      <SafeAreaView edges={['top', 'left', 'right']} style={styles.flex}>
        <View style={styles.staticContent}>{children}</View>
      </SafeAreaView>
    </View>
  )
}

function Background() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient colors={gradients.appBackground} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(45,212,191,0.12)', 'rgba(45,212,191,0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.9, y: 0.7 }}
        style={styles.topGlow}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg
  },
  flex: {
    flex: 1
  },
  topGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '32%'
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
