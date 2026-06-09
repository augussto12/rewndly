import { useLocation, useNavigate } from 'react-router-dom'

type BackButtonProps = {
  fallbackHref: string
  label?: string
  className?: string
}

export function BackButton({ fallbackHref, label = 'Volver', className = '' }: BackButtonProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const canUseHistory = location.key !== 'default'

  function goBack() {
    if (canUseHistory) {
      navigate(-1)
      return
    }

    navigate(fallbackHref, { replace: true })
  }

  return (
    <button type="button" onClick={goBack} className={`back-button ${className}`.trim()}>
      <span aria-hidden="true">&larr;</span>
      <span>{label}</span>
    </button>
  )
}
