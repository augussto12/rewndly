import { Redirect } from 'expo-router'

export default function LibraryRedirect() {
  return <Redirect href="/profile?section=library" />
}
