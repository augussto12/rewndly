import Constants from 'expo-constants'
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken } from '../auth/tokenStore'
import type { MobileAuthResponse } from './types'

const configuredBaseUrl = Constants.expoConfig?.extra?.apiBaseUrl as string | undefined
const apiBaseUrl = configuredBaseUrl?.replace(/\/$/, '') || 'https://rewndly.com'

type RequestOptions = RequestInit & {
  authToken?: string | null
  skipRefresh?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await send(path, options)

  if (response.status === 401 && !options.skipRefresh) {
    const refreshed = await tryRefresh()
    if (refreshed) {
      const retry = await send(path, { ...options, authToken: refreshed.accessToken, skipRefresh: true })
      if (retry.ok) {
        return parse<T>(retry)
      }
      throw await toApiError(retry)
    }
  }

  if (!response.ok) {
    throw await toApiError(response)
  }

  return parse<T>(response)
}

async function send(path: string, options: RequestOptions) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const token = options.authToken ?? getAccessToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers
  })
}

async function tryRefresh() {
  const refreshToken = await getRefreshToken()
  if (!refreshToken) {
    return null
  }

  const response = await send('/api/mobile/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
    skipRefresh: true
  })

  if (!response.ok) {
    setAccessToken(null)
    await setRefreshToken(null)
    return null
  }

  const auth = await response.json() as MobileAuthResponse
  setAccessToken(auth.accessToken)
  await setRefreshToken(auth.refreshToken)
  return auth
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

async function toApiError(response: Response) {
  try {
    const body = await response.json()
    return new Error(body.message ?? body.title ?? 'No se pudo completar la accion.')
  } catch {
    return new Error('No se pudo completar la accion.')
  }
}
