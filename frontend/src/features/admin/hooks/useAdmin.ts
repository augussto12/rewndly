import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteAdminList,
  deleteAdminReview,
  deleteAdminUser,
  disableAdminUser,
  enableAdminUser,
  getAdminActivityEvents,
  getAdminAuditLogs,
  getAdminDashboard,
  getAdminLists,
  getAdminReviews,
  getAdminSystemEvents,
  getAdminUser,
  getAdminUsers,
} from '../services/adminApi'

export function useAdminDashboard() {
  return useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboard })
}

export function useAdminUsers(search = '') {
  return useQuery({ queryKey: ['admin-users', search], queryFn: () => getAdminUsers(search) })
}

export function useAdminUser(id: string | undefined) {
  return useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUser(id ?? ''), enabled: Boolean(id) })
}

export function useDisableAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => disableAdminUser(id, reason),
    onSuccess: (_user, args) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-user', args.id] })
    },
  })
}

export function useEnableAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => enableAdminUser(id, reason),
    onSuccess: (_user, args) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-user', args.id] })
    },
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminUser(id, reason),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
  })
}

export function useAdminReviews() {
  return useQuery({ queryKey: ['admin-reviews'], queryFn: getAdminReviews })
}

export function useDeleteAdminReview() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminReview(id, reason),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-reviews'] }),
  })
}

export function useAdminLists() {
  return useQuery({ queryKey: ['admin-lists'], queryFn: getAdminLists })
}

export function useDeleteAdminList() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string | null }) => deleteAdminList(id, reason),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['admin-lists'] }),
  })
}

export function useAdminSystemEvents() {
  return useQuery({ queryKey: ['admin-system-events'], queryFn: getAdminSystemEvents })
}

export function useAdminActivityEvents() {
  return useQuery({ queryKey: ['admin-activity-events'], queryFn: getAdminActivityEvents })
}

export function useAdminAuditLogs() {
  return useQuery({ queryKey: ['admin-audit-logs'], queryFn: getAdminAuditLogs })
}
