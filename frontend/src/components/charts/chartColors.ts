// Paleta de series alineada con los tokens de marca (theme.css). Orden pensado para
// máximo contraste sobre el fondo oscuro de la app.
export const chartColors = {
  teal: '#2dd4bf',
  violet: '#a78bfa',
  rose: '#fb7185',
  amber: '#fbbf24',
  indigo: '#6366f1',
} as const

export const chartSeriesPalette = [
  chartColors.teal,
  chartColors.violet,
  chartColors.rose,
  chartColors.amber,
  chartColors.indigo,
] as const

export const chartAxis = 'rgba(161, 161, 170, 0.9)' // --color-text-secondary
export const chartGrid = 'rgba(255, 255, 255, 0.07)'
export const chartBaseline = 'rgba(255, 255, 255, 0.14)'
