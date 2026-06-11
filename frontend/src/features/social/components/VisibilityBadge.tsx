import { visibilityChipClass, visibilityLabel } from '../../user-content/utils/visibility'

export function VisibilityBadge({ value }: { value: string }) {
  return <span className={visibilityChipClass(value)}>{visibilityLabel(value)}</span>
}
