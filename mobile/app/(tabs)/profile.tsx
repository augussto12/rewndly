import { useRouter } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useAuth } from '../../src/auth/AuthProvider'
import { AppText } from '../../src/components/AppText'
import { PrimaryButton } from '../../src/components/PrimaryButton'
import { Screen } from '../../src/components/Screen'
import { colors } from '../../src/theme/colors'

export default function ProfileScreen() {
  const auth = useAuth()
  const router = useRouter()

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
      <View style={styles.card}>
        <View style={styles.avatar}><AppText weight="bold" style={styles.avatarText}>{auth.user.displayName.slice(0, 1).toUpperCase()}</AppText></View>
        <AppText weight="bold" style={styles.title}>{auth.user.displayName}</AppText>
        <AppText tone="muted">@{auth.user.username}</AppText>
        <AppText tone="muted">{auth.user.email}</AppText>
        <PrimaryButton variant="secondary" onPress={auth.logout}>Cerrar sesion</PrimaryButton>
      </View>
    </Screen>
  )
}

const styles = StyleSheet.create({
  card: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent
  },
  avatarText: {
    fontSize: 34
  },
  title: {
    fontSize: 30
  }
})
