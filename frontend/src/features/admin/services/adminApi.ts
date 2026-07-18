import { httpClient } from '../../../services/httpClient'
import type {
  AdminActivityEvent,
  AdminActivitySeries,
  AdminAuditLog,
  AdminCloudflareAnalytics,
  AdminDashboard,
  AdminList,
  AdminMdbListStatus,
  AdminPagedResponse,
  AdminReview,
  AdminSystemEvent,
  AdminUser,
  AdminUserDetails,
} from '../types/admin.types'

const pageQuery = 'page=1&pageSize=50'

export function getAdminDashboard() {
  return httpClient<AdminDashboard>('/api/admin/dashboard')
}

export function getAdminActivitySeries(days: number) {
  return httpClient<AdminActivitySeries>(`/api/admin/dashboard/activity?days=${days}`)
}

export function getAdminMdbListStatus() {
  return httpClient<AdminMdbListStatus>('/api/admin/integrations/mdblist')
}

export function getAdminCloudflareAnalytics(days: number) {
  return httpClient<AdminCloudflareAnalytics>(`/api/admin/analytics/cloudflare?days=${days}`)
}

export function getAdminUsers(search = '') {
  return httpClient<AdminPagedResponse<AdminUser>>(`/api/admin/users?${pageQuery}&search=${encodeURIComponent(search)}`)
}

export function getAdminUser(id: string) {
  return httpClient<AdminUserDetails>(`/api/admin/users/${id}`)
}

export function disableAdminUser(id: string, reason: string | null) {
  return httpClient<AdminUserDetails>(`/api/admin/users/${id}/disable`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function enableAdminUser(id: string, reason: string | null) {
  return httpClient<AdminUserDetails>(`/api/admin/users/${id}/enable`, {
    method: 'PATCH',
    body: JSON.stringify({ reason }),
  })
}

export function deleteAdminUser(id: string, reason: string | null) {
  return httpClient<void>(`/api/admin/users/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  })
}

export function getAdminReviews() {
  return httpClient<AdminPagedResponse<AdminReview>>(`/api/admin/reviews?${pageQuery}`)
}

export function deleteAdminReview(id: string, reason: string | null) {
  return httpClient<void>(`/api/admin/reviews/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  })
}

export function getAdminLists() {
  return httpClient<AdminPagedResponse<AdminList>>(`/api/admin/lists?${pageQuery}`)
}

export function deleteAdminList(id: string, reason: string | null) {
  return httpClient<void>(`/api/admin/lists/${id}`, {
    method: 'DELETE',
    body: JSON.stringify({ reason }),
  })
}

export function getAdminSystemEvents() {
  return httpClient<AdminPagedResponse<AdminSystemEvent>>(`/api/admin/system-events?${pageQuery}`)
}

export function getAdminActivityEvents() {
  return httpClient<AdminPagedResponse<AdminActivityEvent>>(`/api/admin/activity-events?${pageQuery}`)
}

export function getAdminActivityEventsPage(page: number, pageSize: number) {
  return httpClient<AdminPagedResponse<AdminActivityEvent>>(
    `/api/admin/activity-events?page=${page}&pageSize=${pageSize}`,
  )
}

export function getAdminAuditLogs() {
  return httpClient<AdminPagedResponse<AdminAuditLog>>(`/api/admin/audit-logs?${pageQuery}`)
}
