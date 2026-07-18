import { useId } from 'react'
import { chartColors } from './chartColors'

type SparklineProps = {
  values: number[]
  color?: string
  height?: number
  className?: string
  ariaLabel?: string
}

const WIDTH = 120

/** Mini gráfico de línea+área para stat tiles. Sin ejes, sin dependencias. */
export function Sparkline({
  values,
  color = chartColors.teal,
  height = 32,
  className,
  ariaLabel,
}: SparklineProps) {
  const gradientId = useId()

  if (values.length === 0) {
    return null
  }

  const max = Math.max(...values, 1)
  const min = Math.min(...values, 0)
  const range = max - min || 1
  const step = values.length > 1 ? WIDTH / (values.length - 1) : 0
  const pad = 2

  const points = values.map((value, index) => {
    const x = values.length > 1 ? index * step : WIDTH / 2
    const y = pad + (1 - (value - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const line = points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`).join(' ')
  const area = `${line} L${WIDTH} ${height} L0 ${height} Z`

  return (
    <svg
      className={className}
      viewBox={`0 0 ${WIDTH} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={ariaLabel}
      style={{ width: '100%', height }}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gradientId})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
