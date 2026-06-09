import { useState } from 'react'
import type { ComponentProps } from 'react'
import { Alert, StyleSheet, TextInput, View } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../src/auth/AuthProvider'
import { AppText } from '../src/components/AppText'
import { PrimaryButton } from '../src/components/PrimaryButton'
import { Screen } from '../src/components/Screen'
import { colors } from '../src/theme/colors'

export default function AuthScreen() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [identifier, setIdentifier] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const auth = useAuth()
  const router = useRouter()

  async function submit() {
    setIsSubmitting(true)
    try {
      if (mode === 'login') {
        await auth.login(identifier, password)
      } else {
        await auth.register(username, email, password)
      }
      router.back()
    } catch (error) {
      Alert.alert('No se pudo entrar', error instanceof Error ? error.message : 'Revisa los datos e intenta de nuevo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Screen>
      <View style={styles.header}>
        <AppText weight="bold" style={styles.title}>{mode === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}</AppText>
        <AppText tone="muted">La misma cuenta funciona en web y en la app.</AppText>
      </View>

      <View style={styles.form}>
        {mode === 'login' ? (
          <Input value={identifier} onChangeText={setIdentifier} placeholder="Usuario o email" />
        ) : (
          <>
            <Input value={username} onChangeText={setUsername} placeholder="Usuario" />
            <Input value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address" />
          </>
        )}
        <Input value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <PrimaryButton onPress={submit} disabled={isSubmitting}>{isSubmitting ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</PrimaryButton>
        <PrimaryButton variant="ghost" onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'No tengo cuenta' : 'Ya tengo cuenta'}
        </PrimaryButton>
      </View>
    </Screen>
  )
}

function Input(props: ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={colors.faint}
      autoCapitalize="none"
      style={styles.input}
    />
  )
}

const styles = StyleSheet.create({
  header: {
    gap: 8
  },
  title: {
    fontSize: 34
  },
  form: {
    gap: 12
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
  }
})
