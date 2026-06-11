import { Component, type ErrorInfo, type ReactNode } from 'react'
import { ErrorFilmIllustration } from '../pages/AppErrorPage'

type RuntimeErrorBoundaryProps = {
  children: ReactNode
}

type RuntimeErrorBoundaryState = {
  hasError: boolean
}

export class RuntimeErrorBoundary extends Component<RuntimeErrorBoundaryProps, RuntimeErrorBoundaryState> {
  state: RuntimeErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Runtime error boundary caught an error', error, errorInfo)
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    return (
      <main className="cinema-page cinema-page--error grid min-h-svh place-items-center px-5 py-8 text-[var(--color-text-primary)]">
        <section className="relative w-full max-w-4xl overflow-hidden rounded-[var(--radius-md)] border border-violet-200/18 bg-[rgba(18,20,36,0.86)] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.42)] sm:p-8 lg:p-10">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-violet-200/70 to-transparent" />
          <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:items-center">
            <div className="relative mx-auto grid aspect-square w-52 place-items-center overflow-hidden rounded-[var(--radius-md)] border border-white/10 bg-black/28 sm:w-60">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,rgba(45,212,191,0.22),transparent_34%),radial-gradient(circle_at_72%_68%,rgba(251,113,133,0.18),transparent_38%)]" />
              <ErrorFilmIllustration />
            </div>
            <div className="text-center lg:text-left">
              <p className="kicker">Error</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl">Algo salió mal en la sala</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-[var(--color-text-secondary)]">
                La página se trabó antes de cargar bien. Podés recargarla o volver al inicio y seguir explorando.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                <button type="button" onClick={() => window.location.reload()} className="primary-action">Recargar</button>
                <a href="/" className="secondary-action">Volver al inicio</a>
              </div>
            </div>
          </div>
        </section>
      </main>
    )
  }
}
