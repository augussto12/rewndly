import { useId, useMemo, useState } from 'react'
import { chartAxis, chartBaseline, chartGrid } from './chartColors'

export type ChartSeries = {
  label: string
  color: string
  values: number[]
  fill?: boolean
}

type TimeSeriesChartProps = {
  labels: string[]
  series: ChartSeries[]
  height?: number
  formatValue?: (value: number) => string
  className?: string
}

const VIEW_W = 720
const PAD_LEFT = 44
const PAD_RIGHT = 16
const PAD_TOP = 12
const PAD_BOTTOM = 26

/** Gráfico de líneas/áreas responsivo en SVG puro, con guía y lectura al pasar el cursor. */
export function TimeSeriesChart({
  labels,
  series,
  height = 240,
  formatValue = (value) => value.toLocaleString('es-AR'),
  className,
}: TimeSeriesChartProps) {
  const gradientId = useId()
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const count = labels.length
  // Si el rango cambió (por teclado, sin mover el mouse) el índice viejo puede quedar
  // fuera de rango; lo descartamos hasta el próximo pointer move.
  const activeIndex = hoverIndex !== null && hoverIndex < count ? hoverIndex : null
  const plotW = VIEW_W - PAD_LEFT - PAD_RIGHT
  const plotH = height - PAD_TOP - PAD_BOTTOM

  const yMax = useMemo(() => {
    const rawMax = Math.max(1, ...series.flatMap((line) => line.values))
    return niceCeil(rawMax)
  }, [series])

  const xAt = (index: number) => (count > 1 ? PAD_LEFT + (index / (count - 1)) * plotW : PAD_LEFT + plotW / 2)
  const yAt = (value: number) => PAD_TOP + (1 - value / yMax) * plotH

  const gridLines = [0, 0.25, 0.5, 0.75, 1]
  const xTicks = pickTicks(count)

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (count === 0) {
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const pointerFraction = (event.clientX - rect.left) / rect.width
    const plotFraction = (pointerFraction * VIEW_W - PAD_LEFT) / plotW
    const index = Math.round(clamp(plotFraction, 0, 1) * (count - 1))
    setHoverIndex(clamp(index, 0, count - 1))
  }

  if (count === 0) {
    return <p className="text-sm text-[var(--color-text-secondary)]">Sin datos todavía.</p>
  }

  const activeXFraction = activeIndex !== null ? xAt(activeIndex) / VIEW_W : 0
  const tooltipOnLeft = activeXFraction > 0.6

  return (
    <div
      className={`relative ${className ?? ''}`}
      onPointerMove={handlePointerMove}
      onPointerLeave={() => setHoverIndex(null)}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${height}`}
        role="img"
        aria-label={`Serie temporal: ${series.map((line) => line.label).join(', ')}`}
        style={{ width: '100%', height: 'auto' }}
      >
        <defs>
          {series.map((line, index) => (
            <linearGradient key={index} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={line.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={line.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {gridLines.map((fraction) => {
          const y = PAD_TOP + fraction * plotH
          const value = Math.round(yMax * (1 - fraction))
          return (
            <g key={fraction}>
              <line x1={PAD_LEFT} y1={y} x2={VIEW_W - PAD_RIGHT} y2={y} stroke={chartGrid} strokeWidth="1" />
              <text x={PAD_LEFT - 8} y={y + 3} textAnchor="end" fontSize="10" fill={chartAxis}>
                {formatCompact(value)}
              </text>
            </g>
          )
        })}

        {series.map((line, index) => {
          const path = line.values
            .map((value, i) => `${i === 0 ? 'M' : 'L'}${xAt(i).toFixed(1)} ${yAt(value).toFixed(1)}`)
            .join(' ')
          const area = `${path} L${xAt(count - 1).toFixed(1)} ${PAD_TOP + plotH} L${xAt(0).toFixed(1)} ${PAD_TOP + plotH} Z`
          return (
            <g key={index}>
              {line.fill ? <path d={area} fill={`url(#${gradientId}-${index})`} /> : null}
              <path d={path} fill="none" stroke={line.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
              {count === 1 ? <circle cx={xAt(0)} cy={yAt(line.values[0] ?? 0)} r="3.5" fill={line.color} /> : null}
            </g>
          )
        })}

        {xTicks.map((index) => (
          <text key={index} x={xAt(index)} y={height - 8} textAnchor="middle" fontSize="10" fill={chartAxis}>
            {labels[index]}
          </text>
        ))}

        {activeIndex !== null ? (
          <g>
            <line
              x1={xAt(activeIndex)}
              y1={PAD_TOP}
              x2={xAt(activeIndex)}
              y2={PAD_TOP + plotH}
              stroke={chartBaseline}
              strokeWidth="1"
            />
            {series.map((line, index) => (
              <circle key={index} cx={xAt(activeIndex)} cy={yAt(line.values[activeIndex] ?? 0)} r="3" fill={line.color} />
            ))}
          </g>
        ) : null}
      </svg>

      {activeIndex !== null ? (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-[var(--radius-sm)] border border-white/10 bg-[rgba(9,9,11,0.92)] p-2 text-xs shadow-[var(--shadow-soft)] backdrop-blur"
          style={{
            left: tooltipOnLeft ? undefined : `calc(${activeXFraction * 100}% + 10px)`,
            right: tooltipOnLeft ? `calc(${(1 - activeXFraction) * 100}% + 10px)` : undefined,
          }}
        >
          <p className="mb-1 font-medium text-[var(--color-text-primary)]">{labels[activeIndex]}</p>
          <div className="grid gap-1">
            {series.map((line) => (
              <div key={line.label} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
                  <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
                  {line.label}
                </span>
                <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                  {formatValue(line.values[activeIndex] ?? 0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function niceCeil(value: number) {
  if (value <= 5) {
    return 5
  }
  const magnitude = 10 ** Math.floor(Math.log10(value))
  const normalized = value / magnitude
  const step = normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10
  return step * magnitude
}

function pickTicks(count: number) {
  if (count <= 1) {
    return count === 1 ? [0] : []
  }
  const desired = Math.min(6, count)
  const ticks = new Set<number>()
  for (let i = 0; i < desired; i++) {
    ticks.add(Math.round((i / (desired - 1)) * (count - 1)))
  }
  return [...ticks].sort((a, b) => a - b)
}

function formatCompact(value: number) {
  if (value >= 1000) {
    return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`
  }
  return `${value}`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
