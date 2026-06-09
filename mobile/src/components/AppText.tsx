import type { PropsWithChildren } from 'react'
import { Text, type TextProps } from 'react-native'
import { colors } from '../theme/colors'

type AppTextProps = PropsWithChildren<TextProps & {
  tone?: 'default' | 'muted' | 'faint' | 'accent'
  weight?: 'regular' | 'semibold' | 'bold'
}>

export function AppText({ children, tone = 'default', weight = 'regular', style, ...props }: AppTextProps) {
  return (
    <Text
      {...props}
      style={[
        {
          color: tone === 'muted' ? colors.muted : tone === 'faint' ? colors.faint : tone === 'accent' ? colors.accent2 : colors.text,
          fontWeight: weight === 'bold' ? '800' : weight === 'semibold' ? '700' : '400'
        },
        style
      ]}
    >
      {children}
    </Text>
  )
}
