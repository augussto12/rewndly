type LoadMoreButtonProps = {
  hasMore: boolean
  isLoading: boolean
  onClick: () => void
  label?: string
}

export function LoadMoreButton({ hasMore, isLoading, onClick, label = 'Mostrar más' }: LoadMoreButtonProps) {
  if (!hasMore) {
    return null
  }

  return (
    <div className="mt-8 flex justify-center">
      <button type="button" onClick={onClick} disabled={isLoading} className="secondary-action">
        {isLoading ? 'Cargando...' : label}
      </button>
    </div>
  )
}
