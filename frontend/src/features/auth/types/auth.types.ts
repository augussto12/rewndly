export type AuthUser = {
  id: string
  username: string
  email: string
  displayName: string
  role: string
  mustChangePassword: boolean
  emailVerifiedAt: string | null
}

export type AuthResponse = {
  accessToken: string
  accessTokenExpiresAt: string
  user: AuthUser
  mustChangePassword: boolean
}

export type RegisterRequest = {
  username: string
  email: string
  password: string
  displayName?: string
}

export type LoginRequest = {
  identifier: string
  password: string
}
