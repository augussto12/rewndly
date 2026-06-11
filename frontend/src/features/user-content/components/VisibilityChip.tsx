import { visibilityChipClass, visibilityLabel } from '../utils/visibility'

export function VisibilityChip({ value }: { value: string }) {
  return <span className={visibilityChipClass(value)}>{visibilityLabel(value)}</span>
}
