export type ToastTone = 'success' | 'error' | 'info' | 'loading'

export type ToastMessage = {
  id: string
  title: string
  description?: string
  tone: ToastTone
}

type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  durationMs?: number
}

type Listener = (messages: ToastMessage[]) => void

let messages: ToastMessage[] = []
const listeners = new Set<Listener>()
const timers = new Map<string, number>()

export const toast = {
  success(title: string, description?: string) {
    return showToast({ title, description, tone: 'success' })
  },
  error(title: string, description?: string) {
    return showToast({ title, description, tone: 'error', durationMs: 7000 })
  },
  info(title: string, description?: string) {
    return showToast({ title, description, tone: 'info' })
  },
  loading(title: string, description?: string) {
    return showToast({ title, description, tone: 'loading', durationMs: 0 })
  },
  update(id: string, input: ToastInput) {
    updateToast(id, input)
  },
}

export function showToast(input: ToastInput) {
  const id = crypto.randomUUID()
  const message: ToastMessage = {
    id,
    title: input.title,
    description: input.description,
    tone: input.tone ?? 'info',
  }

  messages = [message, ...messages].slice(0, 4)
  emit()

  scheduleDismiss(id, input.durationMs ?? 4800)

  return id
}

export function updateToast(id: string, input: ToastInput) {
  const existing = messages.some((message) => message.id === id)
  if (!existing) {
    showToast(input)
    return
  }

  const timer = timers.get(id)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(id)
  }

  messages = messages.map((message) =>
    message.id === id
      ? {
          ...message,
          title: input.title,
          description: input.description,
          tone: input.tone ?? message.tone,
        }
      : message,
  )
  emit()
  scheduleDismiss(id, input.durationMs ?? (input.tone === 'error' ? 7000 : 4200))
}

export function dismissToast(id: string) {
  const timer = timers.get(id)
  if (timer) {
    window.clearTimeout(timer)
    timers.delete(id)
  }

  messages = messages.filter((message) => message.id !== id)
  emit()
}

export function subscribeToToasts(listener: Listener) {
  listeners.add(listener)
  listener(messages)

  return () => {
    listeners.delete(listener)
  }
}

export function getToastsSnapshot() {
  return messages
}

function emit() {
  listeners.forEach((listener) => listener(messages))
}

function scheduleDismiss(id: string, durationMs: number) {
  if (durationMs <= 0) {
    return
  }

  const timer = window.setTimeout(() => dismissToast(id), durationMs)
  timers.set(id, timer)
}
