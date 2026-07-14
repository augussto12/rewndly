import { createContext, useContext, useMemo, type PropsWithChildren } from 'react'
import { useAuth } from '../auth/useAuth'
import { useMyLibrary } from './hooks/useUserContent'
import type { LibraryItem } from './types/userContent.types'

type LibraryLookup = {
  getEntry: (mediaType: string, tmdbId: number) => LibraryItem | undefined
}

const emptyLookup: LibraryLookup = { getEntry: () => undefined }

const LibraryLookupContext = createContext<LibraryLookup>(emptyLookup)

function libraryKey(mediaType: string, tmdbId: number) {
  return `${mediaType}-${tmdbId}`
}

/**
 * Reads the user's library once and exposes an O(1) lookup via context, so the
 * hundreds of poster cards on a page don't each subscribe to the library query
 * and run a linear `find` on every render.
 */
export function LibraryLookupProvider({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth()
  const { data: library } = useMyLibrary(isAuthenticated)

  const value = useMemo<LibraryLookup>(() => {
    const map = new Map<string, LibraryItem>()
    for (const item of library ?? []) {
      map.set(libraryKey(item.mediaType, item.tmdbId), item)
    }
    return { getEntry: (mediaType, tmdbId) => map.get(libraryKey(mediaType, tmdbId)) }
  }, [library])

  return <LibraryLookupContext.Provider value={value}>{children}</LibraryLookupContext.Provider>
}

export function useLibraryEntry(mediaType: string, tmdbId: number) {
  return useContext(LibraryLookupContext).getEntry(mediaType, tmdbId)
}
