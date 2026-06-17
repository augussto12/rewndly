import { Redirect } from 'expo-router'

export default function ListsRedirect() {
  return <Redirect href="/profile?section=lists" />
}
