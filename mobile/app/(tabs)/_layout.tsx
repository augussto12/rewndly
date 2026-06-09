import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { colors } from '../../src/theme/colors'

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent2,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopColor: colors.border
        }
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }} />
      <Tabs.Screen name="search" options={{ title: 'Buscar', tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> }} />
      <Tabs.Screen name="game" options={{ title: 'Posterle', tabBarIcon: ({ color, size }) => <Ionicons name="game-controller" color={color} size={size} /> }} />
      <Tabs.Screen name="library" options={{ title: 'Listas', tabBarIcon: ({ color, size }) => <Ionicons name="albums" color={color} size={size} /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Ionicons name="person-circle" color={color} size={size} /> }} />
    </Tabs>
  )
}
