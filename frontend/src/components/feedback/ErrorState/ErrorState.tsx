type ErrorStateProps = {
  title?: string
  message?: string
}

export function ErrorState({
  title = 'No pudimos cargar el contenido',
  message = 'El servicio no respondio como esperabamos. Proba nuevamente mas tarde.',
}: ErrorStateProps) {
  return (
    <div className="surface-panel relative overflow-hidden p-7 text-center sm:p-9">
      <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-amber-300/80 to-transparent opacity-60" />
      <div className="mx-auto mb-5 grid h-12 w-12 place-items-center rounded-[var(--radius-md)] border border-amber-200/20 bg-amber-950/30 text-amber-100">
        !
      </div>
      <h2 className="text-xl font-semibold text-amber-50">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-amber-100/72">{message}</p>
    </div>
  )
}
