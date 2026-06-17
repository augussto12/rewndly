import type { PropsWithChildren } from 'react'
import { LinearGradient } from 'expo-linear-gradient'
import { Pressable, StyleSheet, View } from 'react-native'
import { colors, gradients } from '../theme/colors'
import { AppText } from './AppText'

type PrimaryButtonProps = PropsWithChildren<{
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
}>

export function PrimaryButton({ children, onPress, variant = 'primary', disabled }: PrimaryButtonProps) {
  const content = (
    <AppText weight="bold" tone={variant === 'ghost' ? 'muted' : 'default'} numberOfLines={1} adjustsFontSizeToFit style={styles.label}>
      {children}
    </AppText>
  )

  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.shell,
        variant === 'primary' ? styles.primaryShell : null,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      {variant === 'primary' ? (
        <LinearGradient colors={gradients.primary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fill}>
          {content}
        </LinearGradient>
      ) : (
        <View style={[styles.fill, variant === 'secondary' ? styles.secondary : styles.ghost]}>
          {content}
        </View>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  shell: {
    minHeight: 46,
    borderRadius: 8,
    overflow: 'hidden'
  },
  fill: {
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: 8
  },
  primaryShell: {
    shadowColor: colors.shadow,
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(255,255,255,0.055)'
  },
  ghost: {
    backgroundColor: 'transparent'
  },
  disabled: {
    opacity: 0.45
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9
  },
  label: {
    textAlign: 'center'
  }
})
