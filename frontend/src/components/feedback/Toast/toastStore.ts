export type ToastTone = 'success' | 'error' | 'info'

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

  const timer = window.setTimeout(() => dismissToast(id), input.durationMs ?? 4800)
  timers.set(id, timer)

  return id
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
