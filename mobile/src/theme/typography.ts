import { Dimensions } from 'react-native'

const BASE_WIDTH = 390
const { width } = Dimensions.get('window')

// Escala las fuentes grandes segun el ancho de pantalla, con limites
// para que no queden ni gigantes en tablets ni apretadas en celus chicos.
const scale = Math.min(Math.max(width / BASE_WIDTH, 0.85), 1.12)

export function rf(size: number) {
  return Math.round(size * scale)
}
