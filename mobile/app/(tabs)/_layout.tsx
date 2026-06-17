import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { Tabs } from 'expo-router'
import { StyleSheet } from 'react-native'
import { colors, gradients } from '../../src/theme/colors'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          lineHeight: 12
        },
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopColor: colors.borderStrong,
          borderTopWidth: 1,
          elevation: 0
        },
        tabBarBackground: () => <LinearGradient colors={gradients.tabBar} style={StyleSheet.absoluteFill} />
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="discover" options={{ title: 'Explorar', tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="compare" options={{ title: 'Comparar', tabBarIcon: ({ color, size }) => <Ionicons name="git-compare" color={color} size={size} /> }} />
      <Tabs.Screen name="game" options={{ title: 'Juegos', tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Yo', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} /> }} />
      <Tabs.Screen name="search" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
    </Tabs>
  )
}
