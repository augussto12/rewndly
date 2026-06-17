import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { AuthProvider } from '../src/auth/AuthProvider'
import { colors } from '../src/theme/colors'

export default function RootLayout() {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgSoft },
            headerTintColor: colors.text,
            headerTitleStyle: { fontWeight: '800' },
            contentStyle: { backgroundColor: colors.bg }
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ title: 'Cuenta', presentation: 'modal' }} />
          <Stack.Screen name="lists" options={{ title: 'Mis listas' }} />
          <Stack.Screen name="list/[id]" options={{ title: 'Lista' }} />
          <Stack.Screen name="movie/[id]" options={{ title: 'Pelicula' }} />
          <Stack.Screen name="series/[id]" options={{ title: 'Serie' }} />
          <Stack.Screen name="person/[id]" options={{ title: 'Persona' }} />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  )
}
