import type { PropsWithChildren } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import { colors } from '../theme/colors'
import { AppText } from './AppText'

type PrimaryButtonProps = PropsWithChildren<{
  onPress: () => void
  variant?: 'primary' | 'secondary' | 'ghost'
  disabled?: boolean
}>

export function PrimaryButton({ children, onPress, variant = 'primary', disabled }: PrimaryButtonProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'primary' ? styles.primary : variant === 'secondary' ? styles.secondary : styles.ghost,
        disabled ? styles.disabled : null,
        pressed && !disabled ? styles.pressed : null
      ]}
    >
      <AppText weight="bold" tone={variant === 'ghost' ? 'muted' : 'default'}>{children}</AppText>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  button: {
    minHeight: 46,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16
  },
  primary: {
    backgroundColor: colors.accent
  },
  secondary: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.panelSoft
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
  }
})
