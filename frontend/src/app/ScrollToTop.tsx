import { type ReactNode, useLayoutEffect } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

type ScrollToTopProps = {
  children: ReactNode
}

export function ScrollToTop({ children }: ScrollToTopProps) {
  const location = useLocation()
  const navigationType = useNavigationType()

  useLayoutEffect(() => {
    if (navigationType === 'POP') {
      return
    }

    if (location.hash) {
      document.querySelector(location.hash)?.scrollIntoView()
      return
    }

    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [location.hash, location.pathname, navigationType])

  return children
}
