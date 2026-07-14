import { useEffect, useState } from 'react'

// Floating "back to top" for long lists. Appears after scrolling down; big 48px
// touch target sized for thumbs on mobile. Sits below the sidebar/toasts z-index.
export function BackToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600)
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver arriba"
      title="Volver arriba"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(0.75rem)',
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 300ms ease, transform 300ms ease',
      }}
      className="fixed bottom-5 right-4 z-30 grid h-12 w-12 place-items-center rounded-full border border-white/12 bg-[rgba(16,19,31,0.92)] text-white shadow-[0_14px_34px_rgba(0,0,0,0.4)] backdrop-blur hover:border-violet-200/40 hover:bg-[rgba(22,26,42,0.96)] sm:bottom-6 sm:right-6"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19V5M5 12l7-7 7 7" />
      </svg>
    </button>
  )
}
