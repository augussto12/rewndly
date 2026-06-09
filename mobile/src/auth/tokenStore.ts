import * as SecureStore from 'expo-secure-store'

const refreshTokenKey = 'rewndly.refreshToken'

let accessToken: string | null = null

export function getAccessToken() {
  return accessToken
}

export function setAccessToken(token: string | null) {
  accessToken = token
}

export async function getRefreshToken() {
  return SecureStore.getItemAsync(refreshTokenKey)
}

export async function setRefreshToken(token: string | null) {
  if (!token) {
    await SecureStore.deleteItemAsync(refreshTokenKey)
    return
  }

  await SecureStore.setItemAsync(refreshTokenKey, token)
}
