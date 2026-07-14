import type { PropsWithChildren } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { ToastViewport } from '../components/feedback/Toast/ToastViewport'
import { AuthProvider } from '../features/auth/AuthProvider'
import { LibraryLookupProvider } from '../features/user-content/LibraryLookupContext'
import { queryClient } from './queryClient'

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <LibraryLookupProvider>{children}</LibraryLookupProvider>
      </AuthProvider>
      <ToastViewport />
    </QueryClientProvider>
  )
}
