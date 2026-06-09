import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastViewport } from '../components/feedback/Toast/ToastViewport'
import { AuthProvider } from '../features/auth/AuthProvider'
import { queryClient } from './queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
      <ToastViewport />
    </QueryClientProvider>
  )
}
