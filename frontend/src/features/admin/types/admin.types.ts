export type AdminPagedResponse<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
}

export type AdminDashboard = {
  totalUsers: number
  activeUsers: number
  disabledUsers: number
  deletedUsers: number
  newUsersLast7Days: number
  savedMovies: number
  savedSeries: number
  reviewsCreated: number
  listsCreated: number
  friendshipsCreated: number
  systemActionsLast24Hours: number
  failedLoginsLast24Hours: number
  mostSavedContent: Array<{ mediaType: string; tmdbId: number; title: string; count: number }>
  topRatedContent: Array<{ mediaType: string; tmdbId: number; title: string; averageRating: number; ratingCount: number }>
}

export type AdminActivityPoint = {
  date: string
  registrations: number
  logins: number
  activeUsers: number
  failedLogins: number
  reviews: number
  libraryItems: number
  lists: number
  friendships: number
}

export type AdminActivitySeries = {
  from: string
  to: string
  days: number
  activeUsersToday: number
  activeUsersLast7Days: number
  activeUsersLast30Days: number
  points: AdminActivityPoint[]
}

export type AdminMdbListStatus = {
  enabled: boolean
  available: boolean
  disabledUntil: string | null
  disabledReason: string | null
  dailyRequestLimit: number | null
  requestsUsedToday: number | null
  patronStatus: string | null
  titlesWithRatings: number
  titlesWithoutData: number
}

export type AdminCloudflarePoint = {
  date: string
  requests: number
  pageViews: number
  uniques: number
  humanVisits: number | null
}

export type AdminCloudflareCountry = {
  country: string
  requests: number
}

export type AdminCloudflareAnalytics = {
  enabled: boolean
  zoneConfigured: boolean
  rumConfigured: boolean
  live: boolean
  from: string
  to: string
  humanVisitsToday: number | null
  humanVisitsLast7Days: number | null
  totalRequests: number
  totalPageViews: number
  totalUniques: number
  points: AdminCloudflarePoint[]
  topCountries: AdminCloudflareCountry[]
  fetchedAt: string | null
}

export type AdminUser = {
  id: string
  username: string
  email: string
  displayName: string
  role: string
  isDisabled: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt: string | null
}

export type AdminUserDetails = AdminUser & {
  avatarUrl: string | null
  bio: string | null
  mustChangePassword: boolean
  emailVerifiedAt: string | null
  disabledAt: string | null
  disableReason: string | null
  deletedAt: string | null
  deleteReason: string | null
}

export type AdminReview = {
  id: string
  userId: string
  username: string
  mediaType: string
  tmdbId: number
  mediaTitle: string
  ratingSnapshot: number | null
  title: string
  containsSpoilers: boolean
  visibility: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type AdminList = {
  id: string
  userId: string
  username: string
  title: string
  description: string | null
  visibility: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

export type AdminSystemEvent = {
  id: string
  userId: string | null
  eventType: string
  entityType: string | null
  entityId: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}

export type AdminActivityEvent = {
  id: string
  userId: string
  username: string
  eventType: string
  mediaType: string | null
  tmdbId: number | null
  mediaTitle: string | null
  createdAt: string
}

export type AdminAuditLog = {
  id: string
  adminUserId: string
  adminUsername: string
  action: string
  targetType: string
  targetId: string | null
  reason: string | null
  ipAddress: string | null
  userAgent: string | null
  createdAt: string
}
